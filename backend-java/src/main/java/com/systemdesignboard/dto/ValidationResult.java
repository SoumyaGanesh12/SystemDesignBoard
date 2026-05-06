package com.systemdesignboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ValidationResult {
	private String nodeId;
	private String severity;
	private String code;
	private String message;
}
