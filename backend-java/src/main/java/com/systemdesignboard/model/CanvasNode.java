package com.systemdesignboard.model;

import java.util.Map;

import lombok.Data;

@Data
public class CanvasNode {
	private String id;
	private Map<String, String> data;
	
	public String getComponentId() {
		return data != null ? data.get("componentId") : null;
	}
	
	public String getCategory() {
		return data != null ? data.get("category") : null;
	}
}
