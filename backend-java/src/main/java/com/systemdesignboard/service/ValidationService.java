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
import com.systemdesignboard.model.CanvasEdge;
import com.systemdesignboard.model.CanvasNode;

@Service
public class ValidationService {
	public ValidationResponse validate(GraphRequest req) {
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
		checkDirectClientDatabaseConnection(edges, nodeComponentMap, results);
		checkMultipleServersNoLoadBalancer(nodes, edges, nodeComponentMap, results);
		checkCircularDependency(edges, results);
		
		return new ValidationResponse(results);
	}
	
	// Rule 1 - Error: client directly connected to database
	private void checkDirectClientDatabaseConnection(
			List<CanvasEdge> edges,
			Map<String, String> nodeComponentMap, 
			List<ValidationResult> results
	) {
		for(CanvasEdge edge: edges) {
			String srcComp = nodeComponentMap.get(edge.getSource());
			String tarComp = nodeComponentMap.get(edge.getTarget());
			
			boolean clientToDb = "client".equals(srcComp) && "database".equals(tarComp);
			boolean dbToClient = "database".equals(srcComp) && "client".equals(tarComp);	
			
			if(clientToDb || dbToClient) {
				results.add(new ValidationResult(
					edge.getSource(),
					"ERROR",
					"DIRECT_CLIENT_DB_CONNECTION",
					"Your database is directly connected to client. " +
					"A server or API gateway should sit between them to protect your data."
				));
			}
		}
	}
	
	// Rule 2 - Warning: more than one server but no load balancer
	private void checkMultipleServersNoLoadBalancer(
			List<CanvasNode> nodes,
			List<CanvasEdge> edges,
			Map<String, String> nodeComponentMap, 
			List<ValidationResult> results
	) {
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
                        "WARNING",
                        "MULTIPLE_SERVERS_NO_LOAD_BALANCER",
                        "You have multiple servers but no load balancer. " +
                        "Without a load balancer traffic cannot be distributed evenly across your servers."
                    ));
                }
			}
		}
	}
	
	// Rule 3 - Error: two nodes pointing at each other (circular dependency)
	private void checkCircularDependency(
			List<CanvasEdge> edges,
			List<ValidationResult> results
	) {
		Set<String> seen = new HashSet<>();
		for(CanvasEdge edge: edges) {
			String forward = edge.getSource() + "->" + edge.getTarget();
			String reverse = edge.getTarget() + "->" + edge.getSource();
			
			if(seen.contains(reverse)) {
				results.add(new ValidationResult(
                    edge.getSource(),
                    "ERROR",
                    "CIRCULAR_DEPENDENCY",
                    "These two components point at each other. " +
                    "This creates a circular dependency which can cause infinite loops and unpredictable behavior."
	            ));
			}
			
			seen.add(forward);
		}
	}
}
