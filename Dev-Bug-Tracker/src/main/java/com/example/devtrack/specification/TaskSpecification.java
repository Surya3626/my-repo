package com.example.devtrack.specification;

import com.example.devtrack.model.Task;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class TaskSpecification {

    public static Specification<Task> filterTasks(String status, String priority, String developerName,
            String type, String branch, String jtrackId,
            String devStartDate, String sitDate, String uatDate, String prodDate) {
        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (status != null && !status.isEmpty()) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("status")), status.toLowerCase()));
            }
            if (priority != null && !priority.isEmpty()) {
                predicates.add(
                        criteriaBuilder.equal(criteriaBuilder.lower(root.get("priority")), priority.toLowerCase()));
            }
            if (developerName != null && !developerName.isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("developerName")),
                        "%" + developerName.toLowerCase() + "%"));
            }
            if (type != null && !type.isEmpty()) {
                predicates.add(criteriaBuilder.equal(criteriaBuilder.lower(root.get("type")), type.toLowerCase()));
            }
            if (branch != null && !branch.isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("branch")),
                        "%" + branch.toLowerCase() + "%"));
            }
            if (jtrackId != null && !jtrackId.isEmpty()) {
                predicates.add(criteriaBuilder.like(criteriaBuilder.lower(root.get("jtrackId")),
                        "%" + jtrackId.toLowerCase() + "%"));
            }
            if (devStartDate != null && !devStartDate.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("devStartDate"), LocalDate.parse(devStartDate)));
            }
            if (sitDate != null && !sitDate.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("sitDate"), LocalDate.parse(sitDate)));
            }
            if (uatDate != null && !uatDate.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("uatDate"), LocalDate.parse(uatDate)));
            }
            if (prodDate != null && !prodDate.isEmpty()) {
                predicates.add(criteriaBuilder.equal(root.get("prodDate"), LocalDate.parse(prodDate)));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }
}
