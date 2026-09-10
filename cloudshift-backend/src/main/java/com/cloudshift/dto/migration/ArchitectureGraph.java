package com.cloudshift.dto.migration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * React Flow–compatible architecture diagram graph.
 * Nodes = AWS services, Edges = connections/data flows.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArchitectureGraph {

    private List<ArchitectureNode> nodes;
    private List<ArchitectureEdge> edges;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArchitectureNode {
        private String id;
        private String type;           // e.g. "awsService", "region", "az"
        private NodeData data;
        private NodePosition position;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodeData {
        private String label;          // e.g. "Amazon EC2"
        private String service;        // e.g. "ec2"
        private String category;       // COMPUTE / DATABASE / STORAGE / NETWORK / SECURITY / MESSAGING
        private String description;
        private String icon;           // service icon identifier for frontend
        private Map<String, String> properties; // e.g. {"instanceType": "t3.medium"}
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class NodePosition {
        private double x;
        private double y;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ArchitectureEdge {
        private String id;
        private String source;         // node id
        private String target;         // node id
        private String label;          // e.g. "JDBC", "HTTPS", "S3 API"
        private String type;           // "default" / "dashed"
        private boolean animated;
    }
}
