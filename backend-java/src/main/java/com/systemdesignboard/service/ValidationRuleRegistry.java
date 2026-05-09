package com.systemdesignboard.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.systemdesignboard.dto.ValidationRule;

@Component
public class ValidationRuleRegistry {
	private final List<ValidationRule> rules = List.of(
		new ValidationRule(
			"DIRECT_CLIENT_DB_CONNECTION",
			"ERROR",
			"Direct Client to Database Connection",
	        "A client should never talk directly to a database. Always place a server or API gateway between them to handle authentication, validation, and security."
		),
		new ValidationRule(
            "MULTIPLE_SERVERS_NO_LOAD_BALANCER",
            "WARNING",
            "Multiple Servers Without Load Balancer",
            "When you have more than one server, a load balancer is needed to distribute traffic evenly. Without it, one server gets overwhelmed while others sit idle."
        ),
        new ValidationRule(
    		"CIRCULAR_DEPENDENCY",
    		"ERROR",
    		"Circular Dependency",
    		"Two components pointing at each other creates a circular dependency. This can cause infinite loops and makes your system unpredictable under load."
        )
	);
	
	public List<ValidationRule> getAllRules(){
		return rules;
	}
	
	public Map<String, ValidationRule> getRuleMap(){
		return rules.stream()
				.collect(Collectors.toMap(ValidationRule::getCode, r->r));
	}
}
