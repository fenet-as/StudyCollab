package com.studycollab.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.io.InputStream;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;

class HibernateProfileConfigurationTest {

    private static final String DDL_AUTO_PROPERTY = "spring.jpa.hibernate.ddl-auto";
    private static final String SHOW_SQL_PROPERTY = "spring.jpa.show-sql";
    private static final String SECURITY_LOG_PROPERTY = "logging.level.org.springframework.security";

    private Properties loadProperties(String filename) throws IOException {
        Properties properties = new Properties();
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(filename)) {
            if (is != null) {
                properties.load(is);
                return properties;
            }
        }
        java.nio.file.Path path = java.nio.file.Paths.get("src/main/resources/" + filename);
        if (java.nio.file.Files.exists(path)) {
            try (InputStream fis = java.nio.file.Files.newInputStream(path)) {
                properties.load(fis);
            }
        }
        return properties;
    }

    @Test
    @DisplayName("Base application.properties defines ddl-auto as none for safe default")
    void baseApplicationProperties_hasDdlAutoNone() throws IOException {
        Properties props = loadProperties("application.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty(DDL_AUTO_PROPERTY))
                    .as("Base application.properties should specify ddl-auto=none")
                    .isEqualTo("none");
        }
    }

    @Test
    @DisplayName("Base application.properties does not enable show-sql or debug security logging")
    void baseApplicationProperties_doesNotEnableShowSqlOrDebugSecurity() throws IOException {
        Properties props = loadProperties("application.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty(SHOW_SQL_PROPERTY))
                    .as("Base application.properties should not force show-sql=true")
                    .isNotEqualTo("true");
            assertThat(props.getProperty(SECURITY_LOG_PROPERTY))
                    .as("Base application.properties should not default security logging to DEBUG")
                    .satisfies(val -> assertThat(val == null || !val.contains("DEBUG")).isTrue());
        }
    }

    @Test
    @DisplayName("application-dev.properties defines ddl-auto as update for local development")
    void devApplicationProperties_hasDdlAutoUpdate() throws IOException {
        Properties props = loadProperties("application-dev.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty(DDL_AUTO_PROPERTY))
                    .as("Dev properties should allow ddl-auto=update for local convenience")
                    .isEqualTo("update");
        }
    }

    @Test
    @DisplayName("application-dev.properties configures show-sql=true and DEBUG security logging")
    void devApplicationProperties_hasShowSqlAndDebugSecurityLogging() throws IOException {
        Properties props = loadProperties("application-dev.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty(SHOW_SQL_PROPERTY))
                    .as("Dev properties should specify show-sql=true")
                    .isEqualTo("true");
            assertThat(props.getProperty(SECURITY_LOG_PROPERTY))
                    .as("Dev properties should configure DEBUG security logging")
                    .contains("DEBUG");
        }
    }

    @Test
    @DisplayName("application-prod.properties defines ddl-auto as validate to protect production schema")
    void prodApplicationProperties_hasDdlAutoValidate() throws IOException {
        Properties props = loadProperties("application-prod.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty(DDL_AUTO_PROPERTY))
                    .as("Prod properties must specify ddl-auto=validate to avoid live schema alterations")
                    .isEqualTo("validate");
        }
    }

    @Test
    @DisplayName("application-prod.properties configures show-sql=false and conservative WARN security logging")
    void prodApplicationProperties_hasShowSqlFalseAndWarnSecurityLogging() throws IOException {
        Properties props = loadProperties("application-prod.properties");
        if (!props.isEmpty()) {
            assertThat(props.getProperty(SHOW_SQL_PROPERTY))
                    .as("Prod properties must specify show-sql=false")
                    .isEqualTo("false");
            assertThat(props.getProperty(SECURITY_LOG_PROPERTY))
                    .as("Prod properties must configure conservative WARN security logging")
                    .contains("WARN");
        }
    }
}
