<#import "template.ftl" as layout>
<@layout.kc_html>
    <div id="kc-form">
        <div id="kc-form-wrapper">
            <form id="kc-register-form" action="${url.registrationAction}" method="post">
                
                <!-- First Name -->
                <div class="form-group">
                    <label for="firstName" class="control-label required">${msg("firstName")}</label>
                    <input type="text" 
                           id="firstName" 
                           class="form-control" 
                           name="firstName" 
                           value="${(register.formData.firstName!'')}" 
                           autocomplete="given-name"
                           required />
                    <#if messagesPerField.existsError('firstName')>
                        <span class="help-block help-block-error">
                            ${kcSanitize(messagesPerField.get('firstName'))?no_esc}
                        </span>
                    </#if>
                </div>

                <!-- Last Name -->
                <div class="form-group">
                    <label for="lastName" class="control-label required">${msg("lastName")}</label>
                    <input type="text" 
                           id="lastName" 
                           class="form-control" 
                           name="lastName" 
                           value="${(register.formData.lastName!'')}" 
                           autocomplete="family-name"
                           required />
                    <#if messagesPerField.existsError('lastName')>
                        <span class="help-block help-block-error">
                            ${kcSanitize(messagesPerField.get('lastName'))?no_esc}
                        </span>
                    </#if>
                </div>

                <!-- Email -->
                <div class="form-group">
                    <label for="email" class="control-label required">${msg("email")}</label>
                    <input type="email" 
                           id="email" 
                           class="form-control" 
                           name="email" 
                           value="${(register.formData.email!'')}" 
                           autocomplete="email"
                           required />
                    <#if messagesPerField.existsError('email')>
                        <span class="help-block help-block-error">
                            ${kcSanitize(messagesPerField.get('email'))?no_esc}
                        </span>
                    </#if>
                </div>

                <!-- Username (если не email as username) -->
                <#if !realm.registrationEmailAsUsername>
                    <div class="form-group">
                        <label for="username" class="control-label required">${msg("username")}</label>
                        <input type="text" 
                               id="username" 
                               class="form-control" 
                               name="username" 
                               value="${(register.formData.username!'')}" 
                               autocomplete="username"
                               required />
                        <#if messagesPerField.existsError('username')>
                            <span class="help-block help-block-error">
                                ${kcSanitize(messagesPerField.get('username'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </#if>

                <!-- Password -->
                <#if passwordRequired??>
                    <div class="form-group">
                        <label for="password" class="control-label required">${msg("password")}</label>
                        <input type="password" 
                               id="password" 
                               class="form-control" 
                               name="password" 
                               autocomplete="new-password"
                               required />
                        <#if messagesPerField.existsError('password')>
                            <span class="help-block help-block-error">
                                ${kcSanitize(messagesPerField.get('password'))?no_esc}
                            </span>
                        </#if>
                    </div>

                    <!-- Password Confirmation -->
                    <div class="form-group">
                        <label for="password-confirm" class="control-label required">${msg("passwordConfirm")}</label>
                        <input type="password" 
                               id="password-confirm" 
                               class="form-control" 
                               name="password-confirm" 
                               autocomplete="new-password"
                               required />
                        <#if messagesPerField.existsError('password-confirm')>
                            <span class="help-block help-block-error">
                                ${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </#if>

                <!-- Recaptcha (если включен) -->
                <#if recaptchaRequired??>
                    <div class="form-group">
                        <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
                        <#if messagesPerField.existsError('recaptchaResponse')>
                            <span class="help-block help-block-error">
                                ${kcSanitize(messagesPerField.get('recaptchaResponse'))?no_esc}
                            </span>
                        </#if>
                    </div>
                </#if>

                <!-- Submit Button -->
                <div class="form-group">
                    <div id="kc-form-buttons">
                        <input class="btn btn-primary btn-block btn-lg" 
                               type="submit" 
                               value="${msg("doRegister")}" />
                    </div>
                </div>
            </form>
        </div>

        <!-- Back to Login -->
        <div id="kc-back-to-login-container">
            <span class="kc-back-to-login-text">
                <a href="${url.loginUrl}" class="kc-back-to-login-link">← Back to Login</a>
            </span>
        </div>
    </div>

    <!-- Messages (errors, success, etc) -->
    <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div class="alert alert-${message.type}">
            <span class="kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
        </div>
    </#if>

    <!-- Recaptcha script -->
    <#if recaptchaRequired??>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
    </#if>
</@layout.kc_html>
