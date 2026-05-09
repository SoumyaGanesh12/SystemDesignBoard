package com.systemdesignboard.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.systemdesignboard.dto.GraphRequest;
import com.systemdesignboard.dto.ValidationResponse;
import com.systemdesignboard.dto.ValidationRule;
import com.systemdesignboard.service.ValidationService;

@RestController
@RequestMapping("/api/validate")
@CrossOrigin(origins = "${frontend.url}")
public class ValidationController {
	private final ValidationService validationServ ;
	
	public ValidationController(ValidationService validationService) {
		this.validationServ = validationService;
	}
	
	@PostMapping
	public ValidationResponse validate(@RequestBody GraphRequest req) {
		return validationServ.validate(req);
	}
	
	@GetMapping("/rules")
	public List<ValidationRule> getRules(){
		return validationServ.getRules();
	}
}
