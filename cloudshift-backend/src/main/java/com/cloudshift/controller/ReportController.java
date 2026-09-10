package com.cloudshift.controller;

import com.cloudshift.entity.Report;
import com.cloudshift.service.ProjectService;
import com.cloudshift.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Reports API.
 */
@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;
    private final ProjectService projectService;

    /**
     * POST /api/reports/generate?projectId={projectId}
     * Generates a full analysis report and uploads it to S3.
     */
    @PostMapping("/generate")
    public ResponseEntity<Report> generateReport(@RequestParam String projectId) {
        String ownerId = projectService.getCurrentUserId();
        return ResponseEntity.ok(reportService.generateFullReport(projectId, ownerId));
    }

    /**
     * GET /api/reports?projectId={projectId}
     * Lists all reports for a project.
     */
    @GetMapping
    public ResponseEntity<List<Report>> listReports(@RequestParam String projectId) {
        String ownerId = projectService.getCurrentUserId();
        return ResponseEntity.ok(reportService.listReports(projectId, ownerId));
    }

    /**
     * GET /api/reports/{id}/download
     * Returns a fresh pre-signed S3 download URL for a report.
     */
    @GetMapping("/{id}/download")
    public ResponseEntity<Map<String, String>> getDownloadUrl(@PathVariable String id) {
        String url = reportService.getDownloadUrl(id);
        return ResponseEntity.ok(Map.of("downloadUrl", url));
    }
}
