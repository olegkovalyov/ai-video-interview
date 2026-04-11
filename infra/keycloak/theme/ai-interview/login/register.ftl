<#import "template.ftl" as layout>
<@layout.kc_html>
    <!-- Page Header -->
    <div class="kc-page-header">
        <h1>Create account</h1>
        <p>Get started with AI-powered interview platform</p>
    </div>

    <!-- Only show non-error messages (success/info) globally; errors shown inline per field -->
    <#if message?has_content && message.type != 'error' && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div class="alert alert-${message.type}" style="margin-bottom: 1rem;">
            <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
    </#if>

    <!-- Register Form -->
    <div id="kc-form">
        <div id="kc-form-wrapper">
            <form id="kc-register-form" action="${url.registrationAction}" method="post">

                <div class="form-group">
                    <label for="firstName" class="control-label">${msg("firstName")}</label>
                    <input type="text" id="firstName" class="form-control" name="firstName"
                           value="${(register.formData.firstName!'')}"
                           autocomplete="given-name" placeholder="John" />
                    <#if messagesPerField.existsError('firstName')>
                        <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
                    </#if>
                </div>

                <div class="form-group">
                    <label for="lastName" class="control-label">${msg("lastName")}</label>
                    <input type="text" id="lastName" class="form-control" name="lastName"
                           value="${(register.formData.lastName!'')}"
                           autocomplete="family-name" placeholder="Doe" />
                    <#if messagesPerField.existsError('lastName')>
                        <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
                    </#if>
                </div>

                <div class="form-group">
                    <label for="email" class="control-label">${msg("email")}</label>
                    <input type="email" id="email" class="form-control" name="email"
                           value="${(register.formData.email!'')}"
                           autocomplete="email" placeholder="name@example.com" />
                    <#if messagesPerField.existsError('email')>
                        <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
                    </#if>
                </div>

                <#if !realm.registrationEmailAsUsername>
                    <div class="form-group">
                        <label for="username" class="control-label">${msg("username")}</label>
                        <input type="text" id="username" class="form-control" name="username"
                               value="${(register.formData.username!'')}"
                               autocomplete="username" placeholder="johndoe" />
                        <#if messagesPerField.existsError('username')>
                            <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                        </#if>
                    </div>
                </#if>

                <#if passwordRequired??>
                    <div class="form-group">
                        <label for="password" class="control-label">${msg("password")}</label>
                        <input type="password" id="password" class="form-control" name="password"
                               autocomplete="new-password" />
                        <#if messagesPerField.existsError('password')>
                            <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                        </#if>
                    </div>

                    <div class="form-group">
                        <label for="password-confirm" class="control-label">${msg("passwordConfirm")}</label>
                        <input type="password" id="password-confirm" class="form-control" name="password-confirm"
                               autocomplete="new-password" />
                        <#if messagesPerField.existsError('password-confirm')>
                            <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                        </#if>
                    </div>
                </#if>

                <#if recaptchaRequired??>
                    <div class="form-group">
                        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                        <#if messagesPerField.existsError('recaptchaResponse')>
                            <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('recaptchaResponse'))?no_esc}</span>
                        </#if>
                    </div>
                </#if>

                <div class="form-group" style="margin-top: 1.5rem;">
                    <input class="btn btn-primary btn-block btn-lg" type="submit" value="Create Account" />
                </div>
            </form>
        </div>

        <div class="kc-separator">
            <div class="line"></div>
            <span class="text">or</span>
        </div>

        <div id="kc-back-to-login-container">
            <span class="kc-back-to-login-text">
                Already have an account? <a href="${url.loginUrl}" class="kc-back-to-login-link">Sign in</a>
            </span>
        </div>
    </div>

    <#if recaptchaRequired??>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    </#if>
</@layout.kc_html>
