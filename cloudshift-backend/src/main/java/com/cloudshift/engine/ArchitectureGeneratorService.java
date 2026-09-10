package com.cloudshift.engine;

import com.cloudshift.dto.migration.ArchitectureGraph;
import com.cloudshift.dto.migration.ArchitectureGraph.*;
import com.cloudshift.entity.MigrationPlan;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Converts a {@link MigrationDecisionEngine.DecisionResult} into a React Flow–ready
 * architecture graph (nodes + edges).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class ArchitectureGeneratorService {

    private final ObjectMapper objectMapper;

    /**
     * Generates a React Flow graph from a decision result and serialises it to JSON.
     */
    public String generateArchitectureJson(MigrationDecisionEngine.DecisionResult result,
                                           MigrationPlan.PriorityProfile profile) {
        ArchitectureGraph graph = buildGraph(result, profile);
        try {
            return objectMapper.writeValueAsString(graph);
        } catch (JsonProcessingException e) {
            log.error("Failed to serialise architecture graph", e);
            return "{}";
        }
    }

    public ArchitectureGraph buildGraph(MigrationDecisionEngine.DecisionResult result,
                                        MigrationPlan.PriorityProfile profile) {
        List<ArchitectureNode> nodes = new ArrayList<>();
        List<ArchitectureEdge> edges = new ArrayList<>();
        AtomicInteger edgeCounter = new AtomicInteger(0);

        // ===== Internet / Users =====
        nodes.add(node("internet", "input", "Internet / Users", "internet", "EXTERNAL",
                "End users or client systems", 100, 300, Map.of()));

        // ===== CloudFront (high availability / high scale) =====
        boolean hasCdn = result.getNetworkingServices().contains("CloudFront");
        if (hasCdn) {
            nodes.add(node("cloudfront", "awsService", "Amazon CloudFront", "cloudfront", "NETWORK",
                    "Global CDN — caches static content at edge", 300, 300, Map.of("scope", "Global")));
            edges.add(edge(edgeCounter, "internet", "cloudfront", "HTTPS", false));
        }

        // ===== Application Load Balancer =====
        String albSource = hasCdn ? "cloudfront" : "internet";
        boolean hasAlb = result.getComputeService().contains("Load Balancer");
        if (hasAlb) {
            nodes.add(node("alb", "awsService", "Application Load Balancer", "alb", "NETWORK",
                    "Distributes HTTP/HTTPS traffic across EC2 instances", 500, 300, Map.of("scheme", "internet-facing")));
            edges.add(edge(edgeCounter, albSource, "alb", "HTTPS", false));
        }

        // ===== Compute =====
        String computeSource = hasAlb ? "alb" : (hasCdn ? "cloudfront" : "internet");
        String computeId     = "compute";
        String computeLabel  = result.getComputeService().contains("ECS") ? "Amazon ECS (Fargate)"
                             : result.getComputeService().contains("EKS") ? "Amazon EKS"
                             : "Amazon EC2 + Auto Scaling";
        String computeIcon   = result.getComputeService().contains("ECS") ? "ecs"
                             : result.getComputeService().contains("EKS") ? "eks" : "ec2";
        nodes.add(node(computeId, "awsService", computeLabel, computeIcon, "COMPUTE",
                result.getComputeService(), 700, 300, Map.of("profile", profile.name())));
        edges.add(edge(edgeCounter, computeSource, computeId, "traffic", false));

        // ===== Database =====
        if (result.getDbService() != null && !result.getDbService().contains("no relational")) {
            String dbId    = "database";
            String dbLabel = result.getDbService().contains("Aurora") ? "Amazon Aurora"
                           : result.getDbService().contains("RDS")    ? "Amazon RDS"
                           : result.getDbService().contains("DocumentDB") ? "Amazon DocumentDB"
                           : result.getDbService().contains("ElastiCache") ? "Amazon ElastiCache"
                           : "Amazon RDS";
            String dbIcon  = dbLabel.toLowerCase().contains("aurora") ? "aurora"
                           : dbLabel.toLowerCase().contains("elasticache") ? "elasticache"
                           : dbLabel.toLowerCase().contains("document") ? "documentdb" : "rds";
            nodes.add(node(dbId, "awsService", dbLabel, dbIcon, "DATABASE",
                    result.getDbService(), 700, 500, Map.of("multiAz", String.valueOf(profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY))));
            edges.add(edge(edgeCounter, computeId, dbId, "JDBC/SQL", false));
        }

        // ===== S3 =====
        nodes.add(node("s3", "awsService", "Amazon S3", "s3", "STORAGE",
                "Object storage — reports, uploads, static assets", 900, 300,
                Map.of("versioning", "enabled", "encryption", "SSE-KMS")));
        edges.add(edge(edgeCounter, computeId, "s3", "S3 API", false));

        // ===== CloudWatch =====
        nodes.add(node("cloudwatch", "awsService", "Amazon CloudWatch", "cloudwatch", "MONITORING",
                "Metrics, logs, alarms, dashboards", 900, 500, Map.of()));
        edges.add(edge(edgeCounter, computeId, "cloudwatch", "metrics", true));

        // ===== IAM =====
        nodes.add(node("iam", "awsService", "AWS IAM", "iam", "SECURITY",
                "Instance roles — no hardcoded credentials", 500, 500, Map.of("type", "instance role")));
        edges.add(edgeDashed(edgeCounter, "iam", computeId, "role"));

        // ===== WAF (high availability) =====
        if (result.getSecurityServices().contains("WAF") && hasAlb) {
            nodes.add(node("waf", "awsService", "AWS WAF", "waf", "SECURITY",
                    "Web Application Firewall — attached to ALB", 500, 150, Map.of()));
            edges.add(edgeDashed(edgeCounter, "waf", "alb", "protect"));
        }

        // ===== SQS (async, if present in compute description) =====
        boolean highAvail = profile == MigrationPlan.PriorityProfile.HIGH_AVAILABILITY;
        if (highAvail) {
            nodes.add(node("sqs", "awsService", "Amazon SQS", "sqs", "MESSAGING",
                    "Async migration job queue", 700, 150, Map.of("type", "Standard Queue")));
            edges.add(edge(edgeCounter, computeId, "sqs", "async jobs", true));
        }

        return ArchitectureGraph.builder().nodes(nodes).edges(edges).build();
    }

    // ===== Helpers =====

    private ArchitectureNode node(String id, String type, String label, String service,
                                  String category, String description, double x, double y,
                                  Map<String, String> properties) {
        return ArchitectureNode.builder()
                .id(id).type(type)
                .data(NodeData.builder()
                        .label(label).service(service).category(category)
                        .description(description).icon(service).properties(properties)
                        .build())
                .position(NodePosition.builder().x(x).y(y).build())
                .build();
    }

    private ArchitectureEdge edge(AtomicInteger counter, String source, String target,
                                  String label, boolean animated) {
        return ArchitectureEdge.builder()
                .id("e" + counter.incrementAndGet())
                .source(source).target(target)
                .label(label).type("default").animated(animated)
                .build();
    }

    private ArchitectureEdge edgeDashed(AtomicInteger counter, String source, String target, String label) {
        return ArchitectureEdge.builder()
                .id("e" + counter.incrementAndGet())
                .source(source).target(target)
                .label(label).type("dashed").animated(false)
                .build();
    }
}
