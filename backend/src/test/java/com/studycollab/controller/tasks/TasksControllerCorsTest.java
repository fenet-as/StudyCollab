package com.studycollab.controller.tasks;

import com.studycollab.config.properties.CorsProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.DefaultCorsProcessor;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class TasksControllerCorsTest {

    private CorsConfigurationSource corsConfigurationSource;
    private DefaultCorsProcessor corsProcessor;

    @BeforeEach
    void setUp() {
        CorsProperties corsProperties = new CorsProperties(null, null, null, null);

        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(corsProperties.getAllowedOrigins());
        configuration.setAllowedMethods(corsProperties.getAllowedMethods());
        configuration.setAllowedHeaders(corsProperties.getAllowedHeaders());
        configuration.setAllowCredentials(corsProperties.isAllowCredentials());

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);

        this.corsConfigurationSource = source;
        this.corsProcessor = new DefaultCorsProcessor();
    }

    @Nested
    @DisplayName("Annotation Tests")
    class AnnotationTests {

        @Test
        @DisplayName("TasksController class does not declare @CrossOrigin annotation")
        void tasksControllerClass_doesNotHaveCrossOriginAnnotation() {
            assertThat(TasksController.class.isAnnotationPresent(CrossOrigin.class))
                    .as("TasksController should not have class-level @CrossOrigin")
                    .isFalse();
        }

        @Test
        @DisplayName("No methods in TasksController declare @CrossOrigin annotation")
        void tasksControllerMethods_doNotHaveCrossOriginAnnotation() {
            List<Method> methodsWithCrossOrigin = Arrays.stream(TasksController.class.getDeclaredMethods())
                    .filter(method -> method.isAnnotationPresent(CrossOrigin.class))
                    .toList();

            assertThat(methodsWithCrossOrigin)
                    .as("No methods in TasksController should declare @CrossOrigin")
                    .isEmpty();
        }
    }

    @Nested
    @DisplayName("Global CORS Policy Enforcement Tests")
    class GlobalCorsPolicyTests {

        @Test
        @DisplayName("Preflight request from unlisted origin is rejected without allow-origin header")
        void preflightRequest_fromUnlistedOrigin_isRejected() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks/group/10");
            request.addHeader("Origin", "https://malicious.example.com");
            request.addHeader("Access-Control-Request-Method", "GET");

            MockHttpServletResponse response = new MockHttpServletResponse();
            CorsConfiguration corsConfig = corsConfigurationSource.getCorsConfiguration(request);

            boolean processed = corsProcessor.processRequest(corsConfig, request, response);

            assertThat(processed)
                    .as("CORS processor should reject unlisted origins")
                    .isFalse();
            assertThat(response.getHeader("Access-Control-Allow-Origin"))
                    .as("Response must not contain Access-Control-Allow-Origin for unlisted origin")
                    .isNull();
        }

        @Test
        @DisplayName("Preflight request from allowed origin receives expected CORS headers")
        void preflightRequest_fromAllowedOrigin_isAccepted() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks/group/10");
            request.addHeader("Origin", "http://localhost:5173");
            request.addHeader("Access-Control-Request-Method", "GET");

            MockHttpServletResponse response = new MockHttpServletResponse();
            CorsConfiguration corsConfig = corsConfigurationSource.getCorsConfiguration(request);

            boolean processed = corsProcessor.processRequest(corsConfig, request, response);

            assertThat(processed)
                    .as("CORS processor should accept allowed origins")
                    .isTrue();
            assertThat(response.getHeader("Access-Control-Allow-Origin"))
                    .isEqualTo("http://localhost:5173");
            assertThat(response.getHeader("Access-Control-Allow-Credentials"))
                    .isEqualTo("true");
        }

        @Test
        @DisplayName("Preflight request to POST /api/tasks from allowed origin is accepted")
        void preflightRequest_postTasksFromAllowedOrigin_isAccepted() throws Exception {
            MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/tasks");
            request.addHeader("Origin", "http://localhost:3000");
            request.addHeader("Access-Control-Request-Method", "POST");
            request.addHeader("Access-Control-Request-Headers", "Content-Type, Authorization");

            MockHttpServletResponse response = new MockHttpServletResponse();
            CorsConfiguration corsConfig = corsConfigurationSource.getCorsConfiguration(request);

            boolean processed = corsProcessor.processRequest(corsConfig, request, response);

            assertThat(processed)
                    .as("CORS processor should accept allowed origins")
                    .isTrue();
            assertThat(response.getHeader("Access-Control-Allow-Origin"))
                    .isEqualTo("http://localhost:3000");
        }
    }
}
