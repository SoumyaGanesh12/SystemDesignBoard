package com.systemdesignboard.dto;

import java.util.List;

import com.systemdesignboard.model.CanvasEdge;
import com.systemdesignboard.model.CanvasNode;

import lombok.Data;

@Data
public class GraphRequest {
	private List<CanvasNode> nodes;
	private List<CanvasEdge> edges;
}
