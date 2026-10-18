-- Migration V6: Normalize legacy localhost/loopback IP addresses in audit_logs to host IP 10.195.254.116
UPDATE audit_logs 
SET ip_address = '10.195.254.116' 
WHERE ip_address IN ('0:0:0:0:0:0:0:1', '127.0.0.1', '::1', 'localhost') 
   OR ip_address IS NULL;
