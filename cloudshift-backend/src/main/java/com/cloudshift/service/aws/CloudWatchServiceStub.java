package com.cloudshift.service.aws;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * CloudWatch service stub for the local dev profile.
 * Logs instead of pushing real metrics.
 */
@Service
@Profile("dev")
@Slf4j
public class CloudWatchServiceStub implements CloudWatchService {

    @Override
    public void putMetric(String metricName, double value, String unit, String dimensions) {
        log.info("[STUB] CloudWatch metric — name={}, value={} {}, dimensions={}",
                metricName, value, unit, dimensions);
    }
}
