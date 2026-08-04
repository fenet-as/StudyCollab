package com.studycollab.config; // Adjust to match your base package

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Expose your uploads folder to the outside world
        // E.g., if files are saved in a local folder called "uploads/"
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/"); // Note: relative to your project directory
    }
}