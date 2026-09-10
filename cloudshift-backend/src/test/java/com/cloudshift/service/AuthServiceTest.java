package com.cloudshift.service;

import com.cloudshift.dto.auth.LoginRequest;
import com.cloudshift.dto.auth.RegisterRequest;
import com.cloudshift.dto.auth.AuthResponse;
import com.cloudshift.entity.User;
import com.cloudshift.repository.UserRepository;
import com.cloudshift.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtTokenProvider jwtTokenProvider;
    @Mock AuthenticationManager authenticationManager;
    @Mock UserDetailsService userDetailsService;
    @Mock UserDetails userDetails;

    @InjectMocks AuthService authService;

    private static final String TEST_EMAIL    = "test@cloudshift.io";
    private static final String TEST_NAME     = "Test User";
    private static final String TEST_PASSWORD = "SecurePass123";
    private static final String TEST_HASH     = "$2a$12$hashedpassword";
    private static final String TEST_TOKEN    = "eyJhbGciOiJIUzI1NiJ9.test.token";
    private static final String TEST_USER_ID  = "user-uuid-123";

    @BeforeEach
    void setUp() {
        // lenient() — these stubs are not used by every test (e.g. bad-credentials test never reaches token generation)
        lenient().when(passwordEncoder.encode(TEST_PASSWORD)).thenReturn(TEST_HASH);
        lenient().when(jwtTokenProvider.generateToken(any())).thenReturn(TEST_TOKEN);
        lenient().when(jwtTokenProvider.getExpirationSeconds()).thenReturn(86400L);
        lenient().when(userDetailsService.loadUserByUsername(TEST_EMAIL)).thenReturn(userDetails);
    }

    // ===== Registration Tests =====

    @Test
    void register_newUser_returnsJwt() {
        when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(TEST_USER_ID);
            return u;
        });

        RegisterRequest req = new RegisterRequest();
        req.setEmail(TEST_EMAIL);
        req.setFullName(TEST_NAME);
        req.setPassword(TEST_PASSWORD);

        AuthResponse response = authService.register(req);

        assertThat(response.getAccessToken()).isEqualTo(TEST_TOKEN);
        assertThat(response.getEmail()).isEqualTo(TEST_EMAIL);
        assertThat(response.getRole()).isEqualTo("USER");
        assertThat(response.getTokenType()).isEqualTo("Bearer");

        verify(userRepository).save(argThat(u ->
                u.getEmail().equals(TEST_EMAIL) &&
                u.getPasswordHash().equals(TEST_HASH)
        ));
    }

    @Test
    void register_duplicateEmail_throwsIllegalStateException() {
        when(userRepository.existsByEmail(TEST_EMAIL)).thenReturn(true);

        RegisterRequest req = new RegisterRequest();
        req.setEmail(TEST_EMAIL);
        req.setFullName(TEST_NAME);
        req.setPassword(TEST_PASSWORD);

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(TEST_EMAIL);

        verify(userRepository, never()).save(any());
    }

    // ===== Login Tests =====

    @Test
    void login_validCredentials_returnsJwt() {
        User user = User.builder()
                .id(TEST_USER_ID)
                .email(TEST_EMAIL)
                .fullName(TEST_NAME)
                .passwordHash(TEST_HASH)
                .role(User.UserRole.USER)
                .build();

        when(userRepository.findByEmail(TEST_EMAIL)).thenReturn(Optional.of(user));

        LoginRequest req = new LoginRequest();
        req.setEmail(TEST_EMAIL);
        req.setPassword(TEST_PASSWORD);

        AuthResponse response = authService.login(req);

        assertThat(response.getAccessToken()).isEqualTo(TEST_TOKEN);
        assertThat(response.getUserId()).isEqualTo(TEST_USER_ID);
        assertThat(response.getEmail()).isEqualTo(TEST_EMAIL);
    }

    @Test
    void login_badCredentials_throwsBadCredentialsException() {
        doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager).authenticate(any());

        LoginRequest req = new LoginRequest();
        req.setEmail(TEST_EMAIL);
        req.setPassword("wrongpassword");

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(BadCredentialsException.class);

        verify(userRepository, never()).findByEmail(any());
    }
}
