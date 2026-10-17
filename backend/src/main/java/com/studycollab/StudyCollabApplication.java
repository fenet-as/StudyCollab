package com.studycollab;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
public class StudyCollabApplication {
    public static void main(String[] args) {
        SpringApplication.run(StudyCollabApplication.class, args);
    }
}