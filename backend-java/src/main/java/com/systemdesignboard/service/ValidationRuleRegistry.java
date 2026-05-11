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
        ),
        new ValidationRule(
            "LOAD_BALANCER_SINGLE_TARGET",
            "WARNING",
            "Load Balancer With Single Target",
            "A load balancer with only one server behind it has nothing to balance. Add more servers or remove the load balancer."
        ),
        new ValidationRule(
            "CDN_CONNECTED_TO_DATABASE",
            "ERROR",
            "CDN Connected to Database",
            "A CDN serves static content from edge locations close to users. It should never connect to a database. CDNs pull content from an origin server or object storage."
        ),
        new ValidationRule(
            "CLIENT_DIRECTLY_TO_MESSAGE_QUEUE",
            "ERROR",
            "Client Directly Connected to Message Queue",
            "Clients should not push directly to a message queue. A server or API gateway should sit between them to validate and authorize requests before queuing."
        ),
        new ValidationRule(
            "NO_API_GATEWAY_MULTIPLE_CLIENTS",
            "WARNING",
            "Multiple Clients Without API Gateway",
            "Multiple clients connecting directly to servers without an API gateway means no centralized routing, rate limiting, or authentication. An API gateway provides a single entry point."
        ),
        new ValidationRule(
            "SERVER_DIRECTLY_TO_CDN",
            "WARNING",
            "Server Connected to CDN",
            "Servers do not push content to CDNs. CDNs pull from an origin server or object storage automatically. This connection suggests a misunderstanding of how CDNs work."
        ),
        new ValidationRule(
            "LOAD_BALANCER_TO_DATABASE",
            "ERROR",
            "Load Balancer Connected to Database",
            "Load balancers distribute traffic to compute resources like servers, not to databases. Database connection pooling is handled at the application level, not by a load balancer."
        ),
        new ValidationRule(
            "MESSAGE_QUEUE_TO_CLIENT",
            "ERROR",
            "Message Queue Connected to Client",
            "Clients cannot consume from message queues directly. A server should consume from the queue and push updates to clients via WebSockets or Server-Sent Events."
        ),
        new ValidationRule(
            "NO_CACHE_BETWEEN_SERVER_AND_DATABASE",
            "WARNING",
            "No Cache Between Server and Database",
            "A server connected directly to a database with no cache in the design means every read hits the database. For read-heavy workloads, a cache like Redis significantly reduces latency and database load."
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
