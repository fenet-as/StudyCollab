package com.studycollab.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController  // marks this class as a REST controller
public class TestController {

    // This is the endpoint /hello
    @GetMapping("/hello")
    public String hello() {
        return "{\"message\":\"Hello StudyCollab!\"}";
    }
}