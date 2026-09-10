package com.cloudshift.service.aws;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

/**
 * S3 service stub for the local dev profile.
 * Real implementation (S3Client calls) will be activated in the "prod" profile.
 */
@Service
@Profile("dev")
@Slf4j
public class S3ServiceStub implements S3Service {

    @Override
    public String uploadFile(String key, byte[] content, String contentType) {
        log.info("[STUB] S3 upload: key={}, size={} bytes, type={}", key, content.length, contentType);
        return "https://stub-s3-bucket.s3.amazonaws.com/" + key;
    }

    @Override
    public byte[] downloadFile(String key) {
        log.info("[STUB] S3 download: key={}", key);
        return new byte[0];
    }

    @Override
    public String generatePresignedUrl(String key, int expiryMinutes) {
        log.info("[STUB] S3 pre-signed URL: key={}, expiry={}min", key, expiryMinutes);
        return "https://stub-s3-bucket.s3.amazonaws.com/" + key + "?stub-presigned=true";
    }

    @Override
    public void deleteFile(String key) {
        log.info("[STUB] S3 delete: key={}", key);
    }
}
