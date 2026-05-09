package com.systemdesignboard.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ValidationRule {
	private String code;
	private String severity;
	private String title;
	private String description;
}
