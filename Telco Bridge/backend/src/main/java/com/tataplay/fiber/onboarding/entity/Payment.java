package com.tataplay.fiber.onboarding.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "payments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Payment extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "transaction_id", unique = true, nullable = false)
    private String transactionId;

    @Column(name = "payment_mode", nullable = false)
    private String paymentMode; // UPI, DEBIT_CARD, CREDIT_CARD, NET_BANKING, WALLET

    @Column(nullable = false)
    private Double amount;

    private Double tax;
    private Double discount;

    @Column(name = "coupon_code")
    private String couponCode;

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED, PENDING
}
