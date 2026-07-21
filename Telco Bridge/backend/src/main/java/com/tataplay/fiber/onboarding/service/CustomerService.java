package com.tataplay.fiber.onboarding.service;

import com.tataplay.fiber.onboarding.entity.Address;
import com.tataplay.fiber.onboarding.entity.Customer;
import com.tataplay.fiber.onboarding.entity.CustomerStatus;

public interface CustomerService {
    Customer registerOrResume(String firstName, String lastName, String mobileNumber, String email);
    Customer registerLead(String firstName, String lastName, String mobileNumber, String email, Address address);
    Customer createAccountAndCustomer(String mobileNumber);
    Customer getByMobileNumber(String mobileNumber);
    Customer getByCustomerId(String customerId);
    Customer getByProspectId(String prospectId);
    Customer updateStatus(String mobileNumber, CustomerStatus status);
    Customer saveAddress(String mobileNumber, Address address);
    Customer assignPlan(String mobileNumber, Long planId);
    Customer updateProfile(String mobileNumber, String firstName, String lastName, String email);
}
