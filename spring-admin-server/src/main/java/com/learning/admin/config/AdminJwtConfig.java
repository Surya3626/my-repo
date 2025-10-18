package com.learning.admin.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpHeaders;

import de.codecentric.boot.admin.server.web.client.HttpHeadersProvider;

@Configuration
public class AdminJwtConfig {
	
    @Bean
    HttpHeadersProvider headersProvider() {
    	return (instance)->{
    		HttpHeaders headers = new HttpHeaders();
    		headers.add(HttpHeaders.AUTHORIZATION, "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0QGdtYWlsLmNvbSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTc2MDc4MzU1OCwiZXhwIjoxNzYwNzg3MTU4fQ.ujIOhsSU-dhKJbWgFIQvd2UlbEKdOrQtoFbEyiozjkI");
    		return headers;
    	};
    }
}

