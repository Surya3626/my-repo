package com.ticket.booking.security;

import java.security.Key;
import java.util.Date;
import java.util.Map;

import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
public class JwtUtil {

	private final String  SECRET = "replace_this_with_a_very_long_secret_key_1234567890";
    private final long expirationMs = 3600000; // 1 hour

    public String generateToken(String username, String role) {
    	log.info("role {}",role);
        return Jwts.builder()
                .setSubject(username)
                .addClaims(Map.of("role",role))
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationMs))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractUsername(String token) {
    	return parseClaims(token).getSubject();
    }

    public boolean validateToken(String token) {
    	 try {
             parseClaims(token);
             return true;
         } catch (JwtException e) {
             return false;
         }
    }
    
    public String extractRole(String token) {
        return parseClaims(token).get("role", String.class);
    }
    
    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSigningKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
    
    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }
}
