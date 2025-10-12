package com.ticket.booking.security;

import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.ticket.booking.entity.LoginUserDetails;
import com.ticket.booking.repo.LoginUserRepo;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService{

	private final LoginUserRepo loginUserRepo;
	
	@Override
	public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

		LoginUserDetails userDetails = loginUserRepo.findByUserId(username);
		if(userDetails!=null) {
			
			return User.withUsername(userDetails.getUserId()).password(userDetails.getPassword())
					.roles(userDetails.getRole())
					.build();
			
		}
	
		throw new UsernameNotFoundException("User Not found");
		
	}

}
