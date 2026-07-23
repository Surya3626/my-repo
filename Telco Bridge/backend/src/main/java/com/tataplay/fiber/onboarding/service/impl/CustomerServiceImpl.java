package com.tataplay.fiber.onboarding.service.impl;

import com.tataplay.fiber.onboarding.entity.*;
import com.tataplay.fiber.onboarding.repository.*;
import com.tataplay.fiber.onboarding.service.AuditService;
import com.tataplay.fiber.onboarding.service.CustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CustomerServiceImpl implements CustomerService {

    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final BroadbandPlanRepository planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuditService auditService;

    @Override
    @Transactional
    public Customer registerOrResume(String firstName, String lastName, String mobileNumber, String email) {
        Optional<Customer> existingCustomer = customerRepository.findByMobileNumber(mobileNumber);
        if (existingCustomer.isPresent()) {
            auditService.log("RESUME_CUSTOMER", "Resuming existing customer session for mobile: " + mobileNumber, mobileNumber);
            return existingCustomer.get();
        }

        if (customerRepository.existsByEmail(email)) {
            throw new RuntimeException("Email address already registered.");
        }

        // Generate mock credentials
        String username = mobileNumber;
        String randomPassword = UUID.randomUUID().toString();
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(randomPassword))
                .role(Role.ROLE_CUSTOMER)
                .enabled(true)
                .build();

        user = userRepository.save(user);

        // Generate customer IDs
        int randomId = (int) (Math.random() * 900000) + 100000;
        String customerId = "TPF" + randomId;
        String accountNumber = "ACT" + randomId;
        String connectionId = "CON" + randomId;

        Customer customer = Customer.builder()
                .customerId(customerId)
                .accountNumber(accountNumber)
                .connectionId(connectionId)
                .firstName(firstName)
                .lastName(lastName)
                .mobileNumber(mobileNumber)
                .email(email)
                .status(CustomerStatus.REGISTERED)
                .user(user)
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        auditService.log("REGISTER_CUSTOMER", "New customer registered with Customer ID: " + customerId, mobileNumber);

        return savedCustomer;
    }

    @Override
    public Customer getByMobileNumber(String mobileNumber) {
        return customerRepository.findByMobileNumber(mobileNumber)
                .orElseThrow(() -> new RuntimeException("Customer not found with mobile: " + mobileNumber));
    }

    @Override
    public Customer getByCustomerId(String customerId) {
        return customerRepository.findByCustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found with Customer ID: " + customerId));
    }

    @Override
    @Transactional
    public Customer updateStatus(String mobileNumber, CustomerStatus status) {
        Customer customer = getByMobileNumber(mobileNumber);
        customer.setStatus(status);
        Customer saved = customerRepository.save(customer);
        auditService.log("UPDATE_STATUS", "Customer status updated to: " + status, mobileNumber);
        return saved;
    }

    @Override
    @Transactional
    public Customer saveAddress(String mobileNumber, Address address) {
        Customer customer = getByMobileNumber(mobileNumber);
        
        Optional<Address> existingOpt = addressRepository.findByCustomerId(customer.getId());
        if (existingOpt.isPresent()) {
            Address existing = existingOpt.get();
            existing.setHouseNumber(address.getHouseNumber());
            existing.setStreet(address.getStreet());
            existing.setLandmark(address.getLandmark());
            existing.setArea(address.getArea());
            existing.setCity(address.getCity());
            existing.setState(address.getState());
            existing.setPincode(address.getPincode());
            existing.setLatitude(address.getLatitude());
            existing.setLongitude(address.getLongitude());
            existing.setAddressLine1(address.getAddressLine1());
            existing.setAddressLine2(address.getAddressLine2());
            existing.setSociety(address.getSociety());
            addressRepository.save(existing);
        } else {
            address.setCustomer(customer);
            addressRepository.save(address);
        }

        customer.setStatus(CustomerStatus.FEASIBILITY_PASSED);
        Customer saved = customerRepository.save(customer);
        auditService.log("SAVE_ADDRESS", "Customer address details saved", mobileNumber);
        return saved;
    }

    @Override
    @Transactional
    public Customer assignPlan(String mobileNumber, Long planId) {
        Customer customer = getByMobileNumber(mobileNumber);
        BroadbandPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new RuntimeException("Plan not found with ID: " + planId));

        Optional<Subscription> existingOpt = subscriptionRepository.findByCustomerId(customer.getId());
        Subscription subscription;
        if (existingOpt.isPresent()) {
            subscription = existingOpt.get();
            subscription.setPlan(plan);
            subscription.setStatus("PENDING_PAYMENT");
        } else {
            subscription = Subscription.builder()
                    .customer(customer)
                    .plan(plan)
                    .status("PENDING_PAYMENT")
                    .build();
        }

        subscriptionRepository.save(subscription);
        customer.setStatus(CustomerStatus.PLAN_CHOSEN);
        Customer saved = customerRepository.save(customer);
        
        auditService.log("SELECT_PLAN", "Customer selected plan: " + plan.getName(), mobileNumber);
        return saved;
    }

    @Override
    @Transactional
    public Customer assignPlanWithDetails(String mobileNumber, com.tataplay.fiber.onboarding.dto.PlanSelectionRequest selection) {
        if (selection == null || selection.getPlanId() == null) {
            throw new RuntimeException("Plan selection request must include a valid plan ID.");
        }

        String category = selection.getCustomerCategory() != null ? selection.getCustomerCategory().toUpperCase() : "RETAIL";
        String billingType = selection.getBillingType() != null ? selection.getBillingType().toUpperCase() : "PREPAID";

        // Business Rule Enforcement: Retail customers MUST use PREPAID billing only
        if ("RETAIL".equals(category) && "POSTPAID".equals(billingType)) {
            throw new RuntimeException("Postpaid billing is reserved exclusively for Enterprise accounts. Retail accounts must select Prepaid billing.");
        }

        Customer customer = getByMobileNumber(mobileNumber);
        BroadbandPlan plan = planRepository.findById(selection.getPlanId())
                .orElseThrow(() -> new RuntimeException("Plan not found with ID: " + selection.getPlanId()));

        Optional<Subscription> existingOpt = subscriptionRepository.findByCustomerId(customer.getId());
        Subscription subscription = existingOpt.orElseGet(() -> Subscription.builder().customer(customer).build());

        subscription.setPlan(plan);
        subscription.setStatus("PENDING_PAYMENT");
        subscription.setBillingType(billingType);
        subscription.setCustomerCategory(category);
        subscription.setBillingCycleMonths(selection.getBillingCycleMonths() != null ? selection.getBillingCycleMonths() : 1);
        subscription.setCreditPeriodDays("POSTPAID".equals(billingType) ? (selection.getCreditPeriodDays() != null ? selection.getCreditPeriodDays() : 30) : 0);
        subscription.setPoNumber(selection.getPoNumber());
        subscription.setCorporateGstin(selection.getCorporateGstin());
        subscription.setAppliedCoupon(selection.getCouponCode());
        subscription.setSecurityDeposit(selection.getSecurityDeposit() != null ? selection.getSecurityDeposit() : 1000.0);
        
        if (selection.getAddonIds() != null && !selection.getAddonIds().isEmpty()) {
            subscription.setSelectedAddons(selection.getAddonIds().toString());
        }

        subscriptionRepository.save(subscription);
        customer.setStatus(CustomerStatus.PLAN_CHOSEN);
        Customer saved = customerRepository.save(customer);

        auditService.log("SELECT_PLAN_ENTERPRISE", 
                String.format("Plan: %s | Category: %s | Billing: %s | Cycle: %d months", 
                        plan.getName(), category, billingType, subscription.getBillingCycleMonths()), 
                mobileNumber);
        return saved;
    }

    @Override
    @Transactional
    public Customer registerLead(String firstName, String lastName, String mobileNumber, String email, Address address) {
        Optional<Customer> existingCustomer = customerRepository.findByMobileNumber(mobileNumber);
        if (existingCustomer.isPresent()) {
            Customer existing = existingCustomer.get();
            if (existing.getCustomerId() != null || existing.getStatus() == CustomerStatus.COMPLETED || existing.getStatus() == CustomerStatus.INSTALLED) {
                throw new RuntimeException("You are already registered. Kindly click on Resume Booking button to continue booking.");
            }
            // If they are submitting again and already exist as lead, update/save the address
            if (address != null) {
                address.setCustomer(existing);
                Optional<Address> existingAddr = addressRepository.findByCustomerId(existing.getId());
                if (existingAddr.isPresent()) {
                    Address addr = existingAddr.get();
                    addr.setHouseNumber(address.getHouseNumber());
                    addr.setStreet(address.getStreet());
                    addr.setLandmark(address.getLandmark());
                    addr.setArea(address.getArea());
                    addr.setCity(address.getCity());
                    addr.setState(address.getState());
                    addr.setPincode(address.getPincode());
                    addr.setLatitude(address.getLatitude());
                    addr.setLongitude(address.getLongitude());
                    addr.setAddressLine1(address.getAddressLine1());
                    addr.setAddressLine2(address.getAddressLine2());
                    addr.setSociety(address.getSociety());
                    addressRepository.save(addr);
                } else {
                    addressRepository.save(address);
                }
            }
            return existing;
        }

        if (customerRepository.existsByEmail(email)) {
            throw new RuntimeException("Email address already registered.");
        }

        String username = mobileNumber;
        String randomPassword = UUID.randomUUID().toString();
        User user = User.builder()
                .username(username)
                .password(passwordEncoder.encode(randomPassword))
                .role(Role.ROLE_CUSTOMER)
                .enabled(true)
                .build();

        user = userRepository.save(user);

        int randomId = (int) (Math.random() * 900000) + 100000;
        String prospectId = "PRP" + randomId;

        Customer customer = Customer.builder()
                .prospectId(prospectId)
                .firstName(firstName)
                .lastName(lastName)
                .mobileNumber(mobileNumber)
                .email(email)
                .status(CustomerStatus.REGISTERED)
                .user(user)
                .build();

        Customer savedCustomer = customerRepository.save(customer);
        
        if (address != null) {
            address.setCustomer(savedCustomer);
            addressRepository.save(address);
        }

        auditService.log("CREATE_LEAD", "New lead created with Prospect ID: " + prospectId, mobileNumber);

        return savedCustomer;
    }

    @Override
    @Transactional
    public Customer createAccountAndCustomer(String mobileNumber) {
        Customer customer = getByMobileNumber(mobileNumber);
        if (customer.getCustomerId() == null) {
            int randomId = (int) (Math.random() * 900000) + 100000;
            String customerId = "TPF" + randomId;
            String accountNumber = "ACT" + randomId;
            String connectionId = "CON" + randomId;

            customer.setCustomerId(customerId);
            customer.setAccountNumber(accountNumber);
            customer.setConnectionId(connectionId);
            customer = customerRepository.save(customer);

            auditService.log("CREATE_ACCOUNT", "Customer account created with Customer ID: " + customerId, mobileNumber);
        }
        return customer;
    }

    @Override
    public Customer getByProspectId(String prospectId) {
        return customerRepository.findByProspectId(prospectId)
                .orElseThrow(() -> new RuntimeException("Customer not found with Prospect ID: " + prospectId));
    }

    @Override
    @Transactional
    public Customer updateProfile(String mobileNumber, String firstName, String lastName, String email) {
        Customer customer = getByMobileNumber(mobileNumber);
        customer.setFirstName(firstName);
        customer.setLastName(lastName);
        customer.setEmail(email);
        Customer saved = customerRepository.save(customer);
        auditService.log("UPDATE_PROFILE", "Customer profile details updated", mobileNumber);
        return saved;
    }
}
