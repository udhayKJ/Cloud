package com.cloudshift.service;

import com.cloudshift.entity.MigrationPlan;
import com.cloudshift.entity.Project;
import com.cloudshift.entity.Report;
import com.cloudshift.exception.ResourceNotFoundException;
import com.cloudshift.repository.MigrationPlanRepository;
import com.cloudshift.repository.ProjectRepository;
import com.cloudshift.repository.ReportRepository;
import com.cloudshift.service.aws.S3Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * Report Service.
 * Generates JSON/text analysis reports, uploads to S3, and provides pre-signed URLs.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ProjectRepository projectRepository;
    private final MigrationPlanRepository planRepo;
    private final ReportRepository reportRepository;
    private final S3Service s3Service;
    private final CostEstimationService costService;
    private final SecurityEvaluationService securityService;
    private final WellArchitectedScoringService waService;
    private final ObjectMapper objectMapper;

    @Value("${app.aws.s3.bucket-name}")
    private String bucketName;

    /**
     * Generates a full analysis report for a project and uploads it to S3.
     */
    @Transactional
    public Report generateFullReport(String projectId, String ownerId) {
        Project project = projectRepository.findByIdAndOwnerId(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));

        List<MigrationPlan> plans = planRepo.findByProjectIdOrderByCreatedAtDesc(projectId);

        // Build report content
        String reportContent = buildReportContent(project, plans);
        byte[] contentBytes = reportContent.getBytes(StandardCharsets.UTF_8);

        // S3 key
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"));
        String s3Key = "reports/" + projectId + "/full-analysis-" + timestamp + ".json";

        // Upload to S3
        String downloadUrl = s3Service.uploadFile(s3Key, contentBytes, "application/json");

        // Persist report record
        Report report = Report.builder()
                .project(project)
                .reportType(Report.ReportType.FULL_ANALYSIS)
                .s3Key(s3Key)
                .downloadUrl(downloadUrl)
                .fileSizeBytes((long) contentBytes.length)
                .status(Report.ReportStatus.READY)
                .build();

        report = reportRepository.save(report);
        log.info("Generated report {} for project {}", report.getId(), projectId);
        return report;
    }

    /**
     * Lists all reports for a project.
     */
    @Transactional(readOnly = true)
    public List<Report> listReports(String projectId, String ownerId) {
        projectRepository.findByIdAndOwnerId(projectId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Project", "id", projectId));
        return reportRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
    }

    /**
     * Refreshes the pre-signed download URL for a report.
     */
    @Transactional
    public String getDownloadUrl(String reportId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Report", "id", reportId));
        String presignedUrl = s3Service.generatePresignedUrl(report.getS3Key(), 60);
        report.setDownloadUrl(presignedUrl);
        reportRepository.save(report);
        return presignedUrl;
    }

    private String buildReportContent(Project project, List<MigrationPlan> plans) {
        try {
            var reportData = Map.of(
                    "projectId", project.getId(),
                    "projectName", project.getName(),
                    "generatedAt", LocalDateTime.now().toString(),
                    "migrationPlans", plans.stream().map(p -> Map.of(
                            "id", p.getId(),
                            "priorityProfile", p.getPriorityProfile().name(),
                            "migrationStrategy", p.getMigrationStrategy().name(),
                            "computeService", p.getComputeService() != null ? p.getComputeService() : "",
                            "dbService", p.getDbService() != null ? p.getDbService() : "",
                            "drStrategy", p.getDrStrategy() != null ? p.getDrStrategy() : "",
                            "estimatedMonthlyUsd", p.getEstimatedCostMonthly() != null
                                    ? p.getEstimatedCostMonthly().toString() : "0"
                    )).toList()
            );
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(reportData);
        } catch (Exception e) {
            log.error("Failed to build report content", e);
            return "{}";
        }
    }
}
