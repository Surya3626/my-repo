package com.ticket.booking.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme.In;
import io.swagger.v3.oas.models.security.SecurityScheme.Type;
import io.swagger.v3.oas.models.servers.Server;

@Configuration
public class SwaggerConfig {

	@Bean
	OpenAPI openAPI() {
		
		return new OpenAPI().info(new Info().title("Event Ticket Booking App")
				.description("Event Ticket Booking App")
				.version("1.0"))
				
				.servers(List.of(new Server()
						.url("http://localhost:8080")
						.description("localhost")))
				
				.addSecurityItem(new SecurityRequirement().addList("bearerAuth"))
				.components(new Components().addSecuritySchemes("bearerAuth", 
						new io.swagger.v3.oas.models.security.SecurityScheme().name("bearerAuth")
						.type(Type.HTTP)
						.scheme("bearer")
						.bearerFormat("JWT")
						.in(In.HEADER)
						))
				;
		
	}
}
