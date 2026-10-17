package com.studycollab.controller.health;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.sql.DataSource;
import java.lang.reflect.Proxy;
import java.sql.Connection;
import java.sql.SQLException;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {

    private DataSource createMockDataSource(Connection connection, SQLException exceptionOnConnect) {
        return (DataSource) Proxy.newProxyInstance(
                DataSource.class.getClassLoader(),
                new Class<?>[]{DataSource.class},
                (proxy, method, args) -> {
                    if ("getConnection".equals(method.getName())) {
                        if (exceptionOnConnect != null) {
                            throw exceptionOnConnect;
                        }
                        return connection;
                    }
                    return null;
                }
        );
    }

    private Connection createMockConnection(boolean isValid) {
        return (Connection) Proxy.newProxyInstance(
                Connection.class.getClassLoader(),
                new Class<?>[]{Connection.class},
                (proxy, method, args) -> {
                    if ("isValid".equals(method.getName())) {
                        return isValid;
                    }
                    if ("close".equals(method.getName())) {
                        return null;
                    }
                    return null;
                }
        );
    }

    @Test
    @DisplayName("Should return 200 OK and status UP when database is reachable")
    void checkHealth_WhenDatabaseIsUp_ReturnsOk() {
        Connection conn = createMockConnection(true);
        DataSource ds = createMockDataSource(conn, null);
        HealthController controller = new HealthController(ds);

        ResponseEntity<Map<String, Object>> response = controller.checkHealth();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("UP");
        assertThat(response.getBody().get("database")).isEqualTo("UP");
        assertThat(response.getBody().get("service")).isEqualTo("studycollab-backend");
        assertThat(response.getBody()).containsKey("timestamp");
    }

    @Test
    @DisplayName("Should return 503 SERVICE_UNAVAILABLE when database is invalid")
    void checkHealth_WhenDatabaseIsNotValid_ReturnsServiceUnavailable() {
        Connection conn = createMockConnection(false);
        DataSource ds = createMockDataSource(conn, null);
        HealthController controller = new HealthController(ds);

        ResponseEntity<Map<String, Object>> response = controller.checkHealth();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("DOWN");
        assertThat(response.getBody().get("database")).isEqualTo("DOWN");
    }

    @Test
    @DisplayName("Should return 503 SERVICE_UNAVAILABLE when database throws exception")
    void checkHealth_WhenDatabaseThrowsException_ReturnsServiceUnavailable() {
        DataSource ds = createMockDataSource(null, new SQLException("Connection refused"));
        HealthController controller = new HealthController(ds);

        ResponseEntity<Map<String, Object>> response = controller.checkHealth();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().get("status")).isEqualTo("DOWN");
        assertThat(response.getBody().get("database")).isEqualTo("DOWN");
        assertThat(response.getBody().get("error")).isEqualTo("Connection refused");
    }
}
