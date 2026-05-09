package com.systemdesignboard.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

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
		
		// Deduplicate - one result per rule code
		List<ValidationResult> deduplicated = results.stream()
				.collect(Collectors.toMap(
					ValidationResult::getCode,
					r -> r,
					(existing, replacement) -> existing
				))
				.values()
				.stream()
				.toList();
		
		return new ValidationResponse(deduplicated);
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
					edge.getSource(),
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
			// Flag all server nodes
			for(CanvasNode node: nodes) {
				if ("server".equals(node.getComponentId())) {
                    results.add(new ValidationResult(
                        node.getId(),
                        rule.getSeverity(),
                        rule.getCode(),
                        rule.getDescription()
                    ));
                }
			}
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
                    edge.getSource(),
                    rule.getSeverity(),
                    rule.getCode(),
                    rule.getDescription()
	            ));
			}
			
			seen.add(forward);
		}
	}
}
