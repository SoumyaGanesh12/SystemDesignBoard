package com.systemdesignboard.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.systemdesignboard.dto.GraphRequest;
import com.systemdesignboard.dto.ValidationResponse;
import com.systemdesignboard.dto.ValidationResult;
import com.systemdesignboard.dto.ValidationRule;
import com.systemdesignboard.model.CanvasEdge;
import com.systemdesignboard.model.CanvasNode;

@Service
public class ValidationService {
	
	private final ValidationRuleRegistry ruleRegistry;
	
	public ValidationService(ValidationRuleRegistry ruleRegistry) {
		this.ruleRegistry = ruleRegistry;
	}
	
	public List<ValidationRule> getRules(){
		return ruleRegistry.getAllRules();
	}
	
	public ValidationResponse validate(GraphRequest req) {
		Map<String, ValidationRule> ruleMap = ruleRegistry.getRuleMap();
		List<ValidationResult> results = new ArrayList<>();
		List<CanvasNode> nodes = req.getNodes();
		List<CanvasEdge> edges = req.getEdges();
		
		if(nodes == null || edges == null) {
			return new ValidationResponse(results);
		}
		
		// Build map of nodeId - connectId for quick lookup
		Map<String, String> nodeComponentMap = new HashMap<>();
		for(CanvasNode node: nodes) {
			nodeComponentMap.put(node.getId(), node.getComponentId());
		}
		
		// Run each validation rule
		checkDirectClientDatabaseConnection(edges, nodeComponentMap, ruleMap, results);
		checkMultipleServersNoLoadBalancer(nodes, edges, nodeComponentMap, ruleMap, results);
		checkCircularDependency(edges, ruleMap, results);
		checkLoadBalancerSingleTarget(nodes, edges, nodeComponentMap, ruleMap, results);
		checkCdnConnectedToDatabase(edges, nodeComponentMap, ruleMap, results);
		checkClientDirectlyToMessageQueue(edges, nodeComponentMap, ruleMap, results);
		checkNoApiGatewayMultipleClients(nodes, edges, nodeComponentMap, ruleMap, results);
		checkServerDirectlyToCdn(edges, nodeComponentMap, ruleMap, results);
		checkLoadBalancerToDatabase(edges, nodeComponentMap, ruleMap, results);
		checkMessageQueueToClient(edges, nodeComponentMap, ruleMap, results);
		checkNoCacheBetweenServerAndDatabase(nodes, edges, nodeComponentMap, ruleMap, results);
		
		return new ValidationResponse(results);
	}
	
	// Rule 1 - Error: client directly connected to database
	private void checkDirectClientDatabaseConnection(
			List<CanvasEdge> edges,
			Map<String, String> nodeComponentMap, 
		    Map<String, ValidationRule> ruleMap,
			List<ValidationResult> results
	) {
		
		ValidationRule rule = ruleMap.get("DIRECT_CLIENT_DB_CONNECTION");
		
		for(CanvasEdge edge: edges) {
			String srcComp = nodeComponentMap.get(edge.getSource());
			String tarComp = nodeComponentMap.get(edge.getTarget());
			
			boolean clientToDb = "client".equals(srcComp) && "database".equals(tarComp);
			boolean dbToClient = "database".equals(srcComp) && "client".equals(tarComp);	
			
			if(clientToDb || dbToClient) {
				results.add(new ValidationResult(
					null,
					edge.getId(),
					rule.getSeverity(),
					rule.getCode(),
					rule.getDescription()
				));
			}
		}
	}
	
	// Rule 2 - Warning: more than one server but no load balancer
	private void checkMultipleServersNoLoadBalancer(
			List<CanvasNode> nodes,
			List<CanvasEdge> edges,
			Map<String, String> nodeComponentMap, 
			Map<String, ValidationRule> ruleMap,
			List<ValidationResult> results
	) {
		
		ValidationRule rule = ruleMap.get("MULTIPLE_SERVERS_NO_LOAD_BALANCER");
		
		long serverCount = nodes.stream()
				.filter(n -> "server".equals(n.getComponentId()))
				.count();
		
		boolean hasLoadBalancer = nodes.stream()
				.anyMatch(n -> "load-balancer".equals(n.getComponentId()));
		
		if(serverCount > 1 && !hasLoadBalancer) {
			 results.add(new ValidationResult(
                 null,
                 null,
                 rule.getSeverity(),
                 rule.getCode(),
                 rule.getDescription()
             ));
		}
	}
	
	// Rule 3 - Error: two nodes pointing at each other (circular dependency)
	private void checkCircularDependency(
			List<CanvasEdge> edges,
			Map<String, ValidationRule> ruleMap,
			List<ValidationResult> results
	) {
		ValidationRule rule = ruleMap.get("CIRCULAR_DEPENDENCY");
		Set<String> seen = new HashSet<>();
		
		for(CanvasEdge edge: edges) {
			String forward = edge.getSource() + "->" + edge.getTarget();
			String reverse = edge.getTarget() + "->" + edge.getSource();
			
			if(seen.contains(reverse)) {
				results.add(new ValidationResult(
                    null,
                    edge.getId(),
                    rule.getSeverity(),
                    rule.getCode(),
                    rule.getDescription()
	            ));
				
				// Flag reverse edge
				for(CanvasEdge reverseEdge: edges) {
					if((reverseEdge.getSource() + "->" + reverseEdge.getTarget()).equals(reverse)) {
						results.add(new ValidationResult(
								null,
								reverseEdge.getId(),
								rule.getSeverity(),
								rule.getCode(),
								rule.getDescription()
						));
						break;
					}
				}
			}
			
			seen.add(forward);
		}
	}
	
	// Rule 4 - Warning: Load balancer with only one target
	private void checkLoadBalancerSingleTarget(
			List<CanvasNode> nodes,
			List<CanvasEdge> edges,
			Map<String, String> nodeComponentMap, 
			Map<String, ValidationRule> ruleMap,
			List<ValidationResult> results
	) {
		ValidationRule rule = ruleMap.get("LOAD_BALANCER_SINGLE_TARGET");
		
		for(CanvasNode node: nodes) {
			if("load-balancer".equals(node.getComponentId())) {
				long targetCount = edges.stream()
						.filter(e -> e.getSource().equals(node.getId()))
						.filter(e -> "server".equals(nodeComponentMap.get(e.getTarget())))
						.count();
				
				if(targetCount == 1) {
					results.add(new ValidationResult(
							node.getId(), null, rule.getSeverity(), rule.getCode(), rule.getDescription()
					));
				}
			}
		}
	}
	
	// Rule 5 - Error: CDN connected to database
	private void checkCdnConnectedToDatabase(
			List<CanvasEdge> edges,
			Map<String, String> nodeComponentMap, 
			Map<String, ValidationRule> ruleMap,
			List<ValidationResult> results
	) {
		ValidationRule rule = ruleMap.get("CDN_CONNECTED_TO_DATABASE");
		for(CanvasEdge edge: edges) {
			String source = nodeComponentMap.get(edge.getSource());
	        String target = nodeComponentMap.get(edge.getTarget());
	
            if (("cdn".equals(source) && "database".equals(target)) ||
                ("database".equals(source) && "cdn".equals(target))) {
                results.add(new ValidationResult(
                    null, edge.getId(), rule.getSeverity(), rule.getCode(), rule.getDescription()
                ));
            }
		}
	}
	
    // Rule 6 - Error: client directly to message queue
    private void checkClientDirectlyToMessageQueue(
            List<CanvasEdge> edges,
            Map<String, String> nodeComponentMap,
            Map<String, ValidationRule> ruleMap,
            List<ValidationResult> results) {

        ValidationRule rule = ruleMap.get("CLIENT_DIRECTLY_TO_MESSAGE_QUEUE");

        for (CanvasEdge edge : edges) {
            String source = nodeComponentMap.get(edge.getSource());
            String target = nodeComponentMap.get(edge.getTarget());

            if ("client".equals(source) && "message-queue".equals(target)) {
                results.add(new ValidationResult(
                    null, edge.getId(), rule.getSeverity(), rule.getCode(), rule.getDescription()
                ));
            }
        }
    }

    // Rule 7 - Warning: multiple clients without API gateway
    private void checkNoApiGatewayMultipleClients(
    		List<CanvasNode> nodes,
    		List<CanvasEdge> edges,
            Map<String, String> nodeComponentMap,
            Map<String, ValidationRule> ruleMap,
            List<ValidationResult> results
    ) {
    	ValidationRule rule = ruleMap.get("NO_API_GATEWAY_MULTIPLE_CLIENTS");
    	
    	long clientCount = nodes.stream()
    			.filter(n -> "client".equals(n.getComponentId()))
    			.count();
    	
    	boolean hasApiGateway = nodes.stream()
    			.anyMatch(n -> "api-gateway".equals(n.getComponentId()));
    	
    	boolean clientConnectsDirectlyToServer = edges.stream()
    			.anyMatch(e -> "client".equals(nodeComponentMap.get(e.getSource()))
    					&& "server".equals(nodeComponentMap.get(e.getTarget())));
    	
    	if(clientCount > 1 && !hasApiGateway && clientConnectsDirectlyToServer) {
    		results.add(new ValidationResult(
    				null, null, rule.getSeverity(), rule.getCode(), rule.getDescription()
    		));
    	}
    }
    
	// Rule 8 - Warning: server connected to CDN
    private void checkServerDirectlyToCdn(
            List<CanvasEdge> edges,
            Map<String, String> nodeComponentMap,
            Map<String, ValidationRule> ruleMap,
            List<ValidationResult> results) {

        ValidationRule rule = ruleMap.get("SERVER_DIRECTLY_TO_CDN");

        for (CanvasEdge edge : edges) {
            String source = nodeComponentMap.get(edge.getSource());
            String target = nodeComponentMap.get(edge.getTarget());

            if ("server".equals(source) && "cdn".equals(target)) {
                results.add(new ValidationResult(
                    null, edge.getId(), rule.getSeverity(), rule.getCode(), rule.getDescription()
                ));
            }
        }
    }
    
    // Rule 9 - Error: load balancer connected to database
    private void checkLoadBalancerToDatabase(
            List<CanvasEdge> edges,
            Map<String, String> nodeComponentMap,
            Map<String, ValidationRule> ruleMap,
            List<ValidationResult> results) {

        ValidationRule rule = ruleMap.get("LOAD_BALANCER_TO_DATABASE");

        for (CanvasEdge edge : edges) {
            String source = nodeComponentMap.get(edge.getSource());
            String target = nodeComponentMap.get(edge.getTarget());

            if (("load-balancer".equals(source) && "database".equals(target)) ||
                ("database".equals(source) && "load-balancer".equals(target))) {
                results.add(new ValidationResult(
                    null, edge.getId(), rule.getSeverity(), rule.getCode(), rule.getDescription()
                ));
            }
        }
    }

    // Rule 10 - Error: message queue connected to client
    private void checkMessageQueueToClient(
            List<CanvasEdge> edges,
            Map<String, String> nodeComponentMap,
            Map<String, ValidationRule> ruleMap,
            List<ValidationResult> results) {

        ValidationRule rule = ruleMap.get("MESSAGE_QUEUE_TO_CLIENT");

        for (CanvasEdge edge : edges) {
            String source = nodeComponentMap.get(edge.getSource());
            String target = nodeComponentMap.get(edge.getTarget());

            if ("message-queue".equals(source) && "client".equals(target)) {
                results.add(new ValidationResult(
                    null, edge.getId(), rule.getSeverity(), rule.getCode(), rule.getDescription()
                ));
            }
        }
    }
    
    // Rule 11 - Warning: server to database with no cache in design
    private void checkNoCacheBetweenServerAndDatabase(
        List<CanvasNode> nodes,
        List<CanvasEdge> edges,
        Map<String, String> nodeComponentMap,
        Map<String, ValidationRule> ruleMap,
        List<ValidationResult> results) {

        ValidationRule rule = ruleMap.get("NO_CACHE_BETWEEN_SERVER_AND_DATABASE");

        boolean hasCache = nodes.stream()
            .anyMatch(n -> "cache".equals(n.getComponentId()));

        if (hasCache) return;

        boolean serverConnectsToDb = edges.stream()
            .anyMatch(e -> "server".equals(nodeComponentMap.get(e.getSource()))
                       && "database".equals(nodeComponentMap.get(e.getTarget())));

        if (serverConnectsToDb) {
            results.add(new ValidationResult(
                null, null, rule.getSeverity(), rule.getCode(), rule.getDescription()
            ));
        }
    }
}
