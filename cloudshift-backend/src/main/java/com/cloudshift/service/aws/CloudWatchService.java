package com.cloudshift.service.aws;

/**
 * Abstraction for CloudWatch metric operations.
 * Implementations: {@link CloudWatchServiceStub} (dev) and CloudWatchServiceImpl (prod — Phase 2).
 */
public interface CloudWatchService {

    /**
     * Pushes a numeric metric to CloudWatch under the configured namespace.
     *
     * @param metricName name of the CloudWatch metric
     * @param value      numeric value
     * @param unit       unit string (e.g. "Count", "Seconds", "Percent")
     * @param dimensions optional key=value dimension pairs (flattened as "k1=v1,k2=v2")
     */
    void putMetric(String metricName, double value, String unit, String dimensions);
}
