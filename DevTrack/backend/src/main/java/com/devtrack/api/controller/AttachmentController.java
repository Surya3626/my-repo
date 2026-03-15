package com.devtrack.api.controller;

import com.devtrack.api.model.Attachment;
import com.devtrack.api.model.User;
import com.devtrack.api.repository.AttachmentRepository;
import com.devtrack.api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/attachments")
@CrossOrigin(origins = "*")
public class AttachmentController {

    @Autowired
    private AttachmentRepository attachmentRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/upload")
    public ResponseEntity<?> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") Long entityId) throws IOException {

        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByUsername(username).orElseThrow();

        Attachment attachment = new Attachment();
        attachment.setFileName(file.getOriginalFilename());
        attachment.setFileType(file.getContentType());
        attachment.setData(file.getBytes());
        attachment.setEntityType(entityType.toUpperCase());
        attachment.setEntityId(entityId);
        attachment.setUploadedBy(currentUser);

        return ResponseEntity.ok(attachmentRepository.save(attachment));
    }

    @GetMapping("/{entityType}/{entityId}")
    public List<Attachment> getAttachments(@PathVariable String entityType, @PathVariable Long entityId) {
        return attachmentRepository.findByEntityTypeAndEntityId(entityType.toUpperCase(), entityId);
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadAttachment(@PathVariable Long id) {
        return attachmentRepository.findById(id)
                .map(attachment -> ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                        .contentType(MediaType.parseMediaType(attachment.getFileType()))
                        .body(attachment.getData()))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAttachment(@PathVariable Long id) {
        return attachmentRepository.findById(id)
                .map(attachment -> {
                    attachmentRepository.delete(attachment);
                    return ResponseEntity.ok().<Void>build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
