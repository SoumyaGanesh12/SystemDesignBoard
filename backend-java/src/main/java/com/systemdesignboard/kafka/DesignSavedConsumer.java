package com.systemdesignboard.kafka;

import java.util.HashMap;
import java.util.Map;

import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.systemdesignboard.service.ValidationService;

@Component
public class DesignSavedConsumer {
	private final ValidationService validationServ;
	private final KafkaTemplate<String, String> kafkaTemplate;
	private final ObjectMapper objectMapper;
	
	public DesignSavedConsumer(
			ValidationService validationService,
			KafkaTemplate<String, String> kafkaTemplate
	) {
		this.validationServ = validationService;
		this.kafkaTemplate = kafkaTemplate;
		this.objectMapper = new ObjectMapper();
	}
	
	@KafkaListener(topics = "design.saved", groupId = "systemdesignboard-validation")
	public void consume(String message) {
		try {
			System.out.println("Received design.saved event");
			
			JsonNode root = objectMapper.readTree(message);
			String designId = root.get("designId").asText();
			
			JsonNode nodesArray = root.get("nodes");
			JsonNode edgesArray = root.get("edges");
			
			int nodeCount = nodesArray.size();
			int edgeCount = edgesArray.size();
			
			// Count component types
			Map<String, Integer> componentCounts = new HashMap<>();
			for(JsonNode nodeJson: nodesArray) {
				String componentId = nodeJson.get("data").get("componentId").asText();
				componentCounts.merge(componentId, 1, Integer::sum);
			}
			
			// Build a summary of the saved design
			Map<String, Object> resultMsg = new HashMap<>();
			resultMsg.put("designId", designId);
			resultMsg.put("type", "DESIGN_SUMMARY");
			resultMsg.put("nodeCount", nodeCount);
			resultMsg.put("edgeCount", edgeCount);
			resultMsg.put("componentCounts", componentCounts);
			resultMsg.put("message", "Design saved with " + nodeCount + " components and " + edgeCount + " connections");
			
			String resultJson = objectMapper.writeValueAsString(resultMsg);
			kafkaTemplate.send("validation.results", designId, resultJson);
			
			System.out.println("Published design summary for: " + designId);
			
		} catch(Exception ex) {
			System.err.println("Error processing design.saved event: " + ex.getMessage());
			ex.printStackTrace();
		}
	}
}


