package com.devtrack.api.services;

import com.devtrack.api.model.*;
import com.devtrack.api.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
public class WorkflowExecutionService {

    @Autowired
    private TaskWorkflowMapRepository taskWorkflowMapRepository;

    @Autowired
    private WorkflowRepository workflowRepository;

    @Autowired
    private TaskRepository taskRepository;

    @Transactional
    public void initializeWorkflow(Long taskId, Long workflowId) {
        Task task = taskRepository.findById(taskId).orElseThrow();
        Workflow workflow = workflowRepository.findById(workflowId).orElseThrow();
        List<WorkflowStep> steps = workflow.getSteps();
        steps.sort(Comparator.comparing(WorkflowStep::getSequence));

        taskWorkflowMapRepository.deleteByTaskId(taskId);

        for (int i = 0; i < steps.size(); i++) {
            WorkflowStep step = steps.get(i);
            TaskWorkflowMap map = new TaskWorkflowMap();
            map.setTask(task);
            map.setWorkflow(workflow);
            map.setStep(step);
            map.setStepName(step.getStepName());
            map.setStepType(step.getStepType());
            map.setSequence(step.getSequence());
            
            if (i == 0) {
                map.setStatus("IN_PROGRESS");
                task.setStatus(step.getStepName());
            } else {
                map.setStatus("NOT_STARTED");
            }
            taskWorkflowMapRepository.save(map);
        }
        taskRepository.save(task);
    }

    @Transactional
    public void approveStep(Long taskId) {
        TaskWorkflowMap currentActiveStep = taskWorkflowMapRepository.findActiveStepByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("No active workflow step found for task: " + taskId));

        currentActiveStep.setStatus("CLOSED");
        taskWorkflowMapRepository.save(currentActiveStep);

        List<TaskWorkflowMap> allSteps = taskWorkflowMapRepository.findByTaskId(taskId);
        allSteps.sort(Comparator.comparing(TaskWorkflowMap::getSequence));

        Optional<TaskWorkflowMap> nextStep = allSteps.stream()
                .filter(s -> s.getSequence() > currentActiveStep.getSequence())
                .findFirst();

        if (nextStep.isPresent()) {
            TaskWorkflowMap next = nextStep.get();
            next.setStatus("IN_PROGRESS");
            taskWorkflowMapRepository.save(next);
            
            Task task = next.getTask();
            task.setStatus(next.getStepName());
            taskRepository.save(task);
        } else {
            // Workflow complete: Mark all steps as CLOSED and task as CLOSED
            Task task = currentActiveStep.getTask();
            task.setStatus("CLOSED");
            taskRepository.save(task);

            allSteps.forEach(step -> {
                step.setStatus("CLOSED");
                taskWorkflowMapRepository.save(step);
            });
        }
    }

    @Transactional
    public void rejectStep(Long taskId) {
        TaskWorkflowMap currentActiveStep = taskWorkflowMapRepository.findActiveStepByTaskId(taskId)
                .orElseThrow(() -> new RuntimeException("No active workflow step found for task: " + taskId));

        List<TaskWorkflowMap> allSteps = taskWorkflowMapRepository.findByTaskId(taskId);
        allSteps.sort(Comparator.comparing(TaskWorkflowMap::getSequence));

        Optional<TaskWorkflowMap> previousStep = allSteps.stream()
                .filter(s -> s.getSequence() < currentActiveStep.getSequence())
                .sorted(Comparator.comparing(TaskWorkflowMap::getSequence).reversed())
                .findFirst();

        if (previousStep.isPresent()) {
            currentActiveStep.setStatus("NOT_STARTED");
            taskWorkflowMapRepository.save(currentActiveStep);

            TaskWorkflowMap prev = previousStep.get();
            prev.setStatus("IN_PROGRESS");
            taskWorkflowMapRepository.save(prev);

            Task task = prev.getTask();
            task.setStatus(prev.getStepName());
            taskRepository.save(task);
        } else {
            throw new RuntimeException("Cannot reject the first step of the workflow.");
        }
    }

    public TaskWorkflowMap getCurrentStep(Long taskId) {
        return taskWorkflowMapRepository.findActiveStepByTaskId(taskId).orElse(null);
    }
}
