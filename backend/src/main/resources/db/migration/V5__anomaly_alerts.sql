-- Flyway Migration V5: AI Anomaly Alerts
-- Adds persistence for Isolation Forest anomaly scores, operational review tracking, and Gemini explanations.

CREATE TABLE IF NOT EXISTS anomaly_alerts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    election_id BIGINT NOT NULL,
    area_id BIGINT NULL,
    observation_timestamp TIMESTAMP NOT NULL,
    anomaly_score DOUBLE NOT NULL,
    severity VARCHAR(30) NOT NULL DEFAULT 'NORMAL',
    review_status VARCHAR(30) NOT NULL DEFAULT 'PENDING_REVIEW',
    model_version VARCHAR(50) NOT NULL DEFAULT 'IsolationForest-v1.0',
    primary_reason TEXT NOT NULL,
    gemini_explanation TEXT NULL,
    contributing_metrics TEXT NULL,
    admin_notes TEXT NULL,
    reviewed_by VARCHAR(50) NULL,
    reviewed_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_anomaly_election FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    CONSTRAINT fk_anomaly_area FOREIGN KEY (area_id) REFERENCES areas(id) ON DELETE SET NULL
);

CREATE INDEX idx_anomaly_election ON anomaly_alerts(election_id);
CREATE INDEX idx_anomaly_status ON anomaly_alerts(review_status);
CREATE INDEX idx_anomaly_timestamp ON anomaly_alerts(observation_timestamp);
CREATE INDEX idx_anomaly_severity ON anomaly_alerts(severity);
