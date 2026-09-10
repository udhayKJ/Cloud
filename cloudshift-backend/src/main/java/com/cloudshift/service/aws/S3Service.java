package com.cloudshift.service.aws;

/**
 * Abstraction for S3 operations.
 * Implementations: {@link S3ServiceStub} (dev) and S3ServiceImpl (prod — Phase 2).
 */
public interface S3Service {

    /**
     * Uploads content to S3 and returns the public or pre-signed URL.
     */
    String uploadFile(String key, byte[] content, String contentType);

    /**
     * Downloads content from S3.
     */
    byte[] downloadFile(String key);

    /**
     * Generates a pre-signed download URL valid for {@code expiryMinutes}.
     */
    String generatePresignedUrl(String key, int expiryMinutes);

    /**
     * Deletes an object from S3.
     */
    void deleteFile(String key);
}
