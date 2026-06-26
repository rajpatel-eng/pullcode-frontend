package com.capstoneproject.codereviewsystem.security.oauth2;

import com.capstoneproject.codereviewsystem.entity.RefreshToken;
import com.capstoneproject.codereviewsystem.entity.User;
import com.capstoneproject.codereviewsystem.repos.RefreshTokenRepository;
import com.capstoneproject.codereviewsystem.repos.UserRepository;
import com.capstoneproject.codereviewsystem.security.JwtTokenProvider;
import com.capstoneproject.codereviewsystem.security.UserPrincipal;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler
        extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-token-expiration-ms}")
    private long refreshTokenDurationMs;

    @Value("${app.jwt.access-token-expiration-ms}")
    private long accessTokenExpirationMs;

    /**
     * Determine the frontend origin from the request's Origin / Referer header,
     * falling back to the configured default so we work in both dev and prod.
     */
    private String resolveFrontendOrigin(HttpServletRequest request) {
        // 1. Try Origin header (set by the browser during OAuth flow)
        String origin = request.getHeader("Origin");
        if (origin != null && !origin.isBlank()) {
            return origin;
        }
        // 2. Try Referer header
        String referer = request.getHeader("Referer");
        if (referer != null && !referer.isBlank()) {
            try {
                URI uri = URI.create(referer);
                return uri.getScheme() + "://" + uri.getAuthority();
            } catch (Exception ignored) {}
        }
        // 3. Hardcoded default — works for local dev; override via env var in prod
        return System.getenv().getOrDefault("FRONTEND_URL", "http://localhost:5173");
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {

        UserPrincipal userPrincipal = (UserPrincipal) authentication.getPrincipal();

        String accessToken  = jwtTokenProvider.generateTokenFromEmail(userPrincipal.getEmail());
        RefreshToken refresh = createRefreshToken(userPrincipal.getId());

        log.info("OAuth2 login success for: {} — redirecting to /login-success with tokens",
                userPrincipal.getEmail());

        clearAuthenticationAttributes(request);

        // Build the redirect URL: <frontend-origin>/login-success?token=...&refreshToken=...&email=...
        String frontendOrigin = resolveFrontendOrigin(request);
        String redirectUrl = UriComponentsBuilder
                .fromUriString(frontendOrigin + "/login-success")
                .queryParam("token", accessToken)
                .queryParam("refreshToken", refresh.getToken())
                .queryParam("email", userPrincipal.getEmail())
                .build().toUriString();

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }

    private RefreshToken createRefreshToken(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        refreshTokenRepository.findByUser(user)
                .ifPresent(refreshTokenRepository::delete);

        return refreshTokenRepository.save(
                RefreshToken.builder()
                        .user(user)
                        .token(UUID.randomUUID().toString())
                        .expiryDate(Instant.now().plusMillis(refreshTokenDurationMs))
                        .build()
        );
    }
}
