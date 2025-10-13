package com.ticket.booking.controller;

import java.time.LocalDateTime;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.Errors;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.ticket.booking.entity.LoginUserDetails;
import com.ticket.booking.repo.LoginUserRepo;
import com.ticket.booking.security.JwtUtil;
import com.ticket.booking.service.UserEventService;
import com.ticket.booking.vo.GenericResponseVo;
import com.ticket.booking.vo.LoginVo;
import com.ticket.booking.vo.RegisterVo;
import com.ticket.booking.vo.ResponseVo;

import jakarta.annotation.Nullable;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@RestController
@Slf4j
@RequiredArgsConstructor
@RequestMapping("/public")
public class UserControllerImpl {
	
	private final LoginUserRepo loginUserRepo;
	private final AuthenticationManager authenticationManager;
	private final JwtUtil jwtUtil;
	private final PasswordEncoder passwordEncoder;
	private final UserEventService eventService;
	private final UserDetailsService detailsService;

	@PostMapping("/register")
	public ResponseEntity<?> register(@RequestBody RegisterVo request){
		
		try {
			LoginUserDetails userDetails = loginUserRepo.findByUserId(request.getEmailId());
			if(userDetails!=null) {
				return ResponseEntity.badRequest().body(ResponseVo.builder().statusCode("0001").statusDescription("user already exist")
						.statusType("Error").build());
			}
			
			LoginUserDetails user = new LoginUserDetails();
			user.setUserId(request.getEmailId());
			user.setPassword(passwordEncoder.encode(request.getPassword()));
			user.setEmailId(request.getEmailId());
			user.setMobileNo(request.getRmn());
			user.setCreatedBy("system");
			user.setRole(request.getRole());
			user.setUserName(request.getName());
			
			loginUserRepo.save(user);
			
			return ResponseEntity.ok().body(ResponseVo.builder().statusCode("0000").statusDescription("user created succesfully")
					.statusType("Success").build());
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}
		
		
		return ResponseEntity.internalServerError().body(ResponseVo.builder().statusCode("9999").statusDescription("Technical Exception Occured")
					.statusType("Error").build());
		
	}

	@PostMapping("/login")
	public ResponseEntity<ResponseVo> login(@Valid @RequestBody LoginVo req, Errors error){
		try {
			if(error.hasErrors()) {
				return ResponseEntity.badRequest().body(ResponseVo.builder().statusCode("1111").statusDescription(error.getAllErrors().get(0).getDefaultMessage())
						.statusType("Error").build());
			}
			
			Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(req.getUserId(), req.getPassword()));
			if(authentication.isAuthenticated()) {
				
				UserDetails userDetails = detailsService.loadUserByUsername(req.getUserId());
				String role = userDetails.getAuthorities().iterator().next().getAuthority().replace("ROLE_", "");
				
				return ResponseEntity.ok(ResponseVo.builder().statusCode("0000")
						.statusDescription("Login successful").statusType("Success")
						.token(jwtUtil.generateToken(req.getUserId(), role)).build());
			}else {
				return ResponseEntity.badRequest().body(ResponseVo.builder().statusCode("1111").statusDescription("Invalid Credentials")
						.statusType("Error").build());
			}

		} catch (Exception e) {
			log.error("Exception ",e);
		}

		return ResponseEntity.internalServerError().body(ResponseVo.builder().statusCode("9999").statusDescription("Invalid Credentials")
				.statusType("Error").build());	
	}
	
	@GetMapping("/viewEvents")
	public ResponseEntity<?> viewEvents(@Nullable@RequestParam LocalDateTime eventDate, @Nullable@RequestParam Long eventId) {
		try {
			return eventService.fetchAllEvents(eventDate, eventId);
			
		} catch (Exception e) {
			log.error("Exception ",e);
		}
		
		return ResponseEntity.internalServerError().body(GenericResponseVo.builder().statusCode("9999").statusDescription("Technical Exception Occured")
				.statusType("Error").build());
	}
	
	
}
