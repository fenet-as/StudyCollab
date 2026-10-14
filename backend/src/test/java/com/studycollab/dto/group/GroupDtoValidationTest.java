package com.studycollab.dto.group;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class GroupDtoValidationTest {

    private static Validator validator;

    @BeforeAll
    static void setUpValidator() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }

    @Nested
    @DisplayName("GroupCreateDto validation")
    class GroupCreateDtoValidationTests {

        @Test
        @DisplayName("Valid name and description produces no violations")
        void validGroupCreateDto_noViolations() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("Calculus Study Group");
            dto.setDescription("Weekly calculus study sessions");

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Valid name with null description produces no violations")
        void validGroupCreateDto_nullDescription_noViolations() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("Physics 101");
            dto.setDescription(null);

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Null name violates @NotBlank")
        void nullName_violatesNotBlank() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName(null);

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupCreateDto> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("name");
            assertThat(violation.getMessage()).isEqualTo("Group name is required");
        }

        @Test
        @DisplayName("Empty or whitespace name violates @NotBlank")
        void whitespaceName_violatesNotBlank() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("   ");

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupCreateDto> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("name");
            assertThat(violation.getMessage()).isEqualTo("Group name is required");
        }

        @Test
        @DisplayName("Name exceeding 100 characters violates @Size")
        void nameExceeding100Chars_violatesSize() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("A".repeat(101));

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupCreateDto> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("name");
            assertThat(violation.getMessage()).isEqualTo("Group name must not exceed 100 characters");
        }

        @Test
        @DisplayName("Name with exactly 100 characters produces no violations")
        void nameExactly100Chars_noViolations() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("A".repeat(100));

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Description exceeding 500 characters violates @Size")
        void descriptionExceeding500Chars_violatesSize() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("Valid Name");
            dto.setDescription("D".repeat(501));

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupCreateDto> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("description");
            assertThat(violation.getMessage()).isEqualTo("Group description must not exceed 500 characters");
        }

        @Test
        @DisplayName("Description with exactly 500 characters produces no violations")
        void descriptionExactly500Chars_noViolations() {
            GroupCreateDto dto = new GroupCreateDto();
            dto.setName("Valid Name");
            dto.setDescription("D".repeat(500));

            Set<ConstraintViolation<GroupCreateDto>> violations = validator.validate(dto);

            assertThat(violations).isEmpty();
        }
    }

    @Nested
    @DisplayName("AddMemberRequest validation")
    class AddMemberRequestValidationTests {

        @Test
        @DisplayName("Valid email produces no violations")
        void validEmail_noViolations() {
            AddMemberRequest request = new AddMemberRequest();
            request.setEmail("student@studycollab.com");

            Set<ConstraintViolation<AddMemberRequest>> violations = validator.validate(request);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Null email violates @NotBlank")
        void nullEmail_violatesNotBlank() {
            AddMemberRequest request = new AddMemberRequest();
            request.setEmail(null);

            Set<ConstraintViolation<AddMemberRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<AddMemberRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("email");
            assertThat(violation.getMessage()).isEqualTo("Email is required");
        }

        @Test
        @DisplayName("Blank email violates @NotBlank")
        void blankEmail_violatesNotBlank() {
            AddMemberRequest request = new AddMemberRequest();
            request.setEmail("   ");

            Set<ConstraintViolation<AddMemberRequest>> violations = validator.validate(request);

            assertThat(violations).isNotEmpty();
            assertThat(violations)
                    .extracting(ConstraintViolation::getMessage)
                    .contains("Email is required");
        }

        @Test
        @DisplayName("Malformed email violates @Email")
        void malformedEmail_violatesEmail() {
            AddMemberRequest request = new AddMemberRequest();
            request.setEmail("not-a-valid-email");

            Set<ConstraintViolation<AddMemberRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<AddMemberRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("email");
            assertThat(violation.getMessage()).isEqualTo("Invalid email format");
        }
    }

    @Nested
    @DisplayName("GroupUpdateRequest validation")
    class GroupUpdateRequestValidationTests {

        @Test
        @DisplayName("Valid update request produces no violations")
        void validUpdateRequest_noViolations() {
            GroupUpdateRequest request = new GroupUpdateRequest();
            request.setName("Updated Group Name");
            request.setDescription("Updated Description");

            Set<ConstraintViolation<GroupUpdateRequest>> violations = validator.validate(request);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Null name violates @NotBlank")
        void nullName_violatesNotBlank() {
            GroupUpdateRequest request = new GroupUpdateRequest();
            request.setName(null);

            Set<ConstraintViolation<GroupUpdateRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupUpdateRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("name");
            assertThat(violation.getMessage()).isEqualTo("Group name is required");
        }

        @Test
        @DisplayName("Whitespace name violates @NotBlank")
        void whitespaceName_violatesNotBlank() {
            GroupUpdateRequest request = new GroupUpdateRequest();
            request.setName("   ");

            Set<ConstraintViolation<GroupUpdateRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupUpdateRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("name");
            assertThat(violation.getMessage()).isEqualTo("Group name is required");
        }

        @Test
        @DisplayName("Name exceeding 100 characters violates @Size")
        void nameExceeding100Chars_violatesSize() {
            GroupUpdateRequest request = new GroupUpdateRequest();
            request.setName("A".repeat(101));

            Set<ConstraintViolation<GroupUpdateRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupUpdateRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("name");
            assertThat(violation.getMessage()).isEqualTo("Group name must not exceed 100 characters");
        }

        @Test
        @DisplayName("Description exceeding 500 characters violates @Size")
        void descriptionExceeding500Chars_violatesSize() {
            GroupUpdateRequest request = new GroupUpdateRequest();
            request.setName("Valid Name");
            request.setDescription("D".repeat(501));

            Set<ConstraintViolation<GroupUpdateRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<GroupUpdateRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("description");
            assertThat(violation.getMessage()).isEqualTo("Group description must not exceed 500 characters");
        }
    }

    @Nested
    @DisplayName("JoinGroupRequest validation")
    class JoinGroupRequestValidationTests {

        @Test
        @DisplayName("Valid invite code produces no violations")
        void validInviteCode_noViolations() {
            JoinGroupRequest request = new JoinGroupRequest("INVITE-12345");

            Set<ConstraintViolation<JoinGroupRequest>> violations = validator.validate(request);

            assertThat(violations).isEmpty();
        }

        @Test
        @DisplayName("Null invite code violates @NotBlank")
        void nullInviteCode_violatesNotBlank() {
            JoinGroupRequest request = new JoinGroupRequest(null);

            Set<ConstraintViolation<JoinGroupRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<JoinGroupRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("inviteCode");
            assertThat(violation.getMessage()).isEqualTo("Invite code is required");
        }

        @Test
        @DisplayName("Blank invite code violates @NotBlank")
        void blankInviteCode_violatesNotBlank() {
            JoinGroupRequest request = new JoinGroupRequest("   ");

            Set<ConstraintViolation<JoinGroupRequest>> violations = validator.validate(request);

            assertThat(violations).hasSize(1);
            ConstraintViolation<JoinGroupRequest> violation = violations.iterator().next();
            assertThat(violation.getPropertyPath().toString()).isEqualTo("inviteCode");
            assertThat(violation.getMessage()).isEqualTo("Invite code is required");
        }
    }
}
