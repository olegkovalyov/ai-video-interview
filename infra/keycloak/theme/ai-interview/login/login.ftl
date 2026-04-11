<#import "template.ftl" as layout>
<@layout.kc_html>
    <!-- Page Header -->
    <div class="kc-page-header">
        <h1>Welcome back</h1>
        <p>Sign in to your account to continue</p>
    </div>

    <!-- Global messages (login errors like "Invalid username or password") -->
    <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <#if message.type = 'error' && !messagesPerField.existsError('username') && !messagesPerField.existsError('password')>
            <div class="alert alert-error" style="margin-bottom: 1rem;">
                <span>${kcSanitize(message.summary)?no_esc}</span>
            </div>
        <#elseif message.type != 'error'>
            <div class="alert alert-${message.type}" style="margin-bottom: 1rem;">
                <span>${kcSanitize(message.summary)?no_esc}</span>
            </div>
        </#if>
    </#if>

    <!-- Login Form -->
    <div id="kc-form">
        <div id="kc-form-wrapper">
            <#if realm.password>
                <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                    <#if !usernameEditDisabled??>
                        <div class="form-group">
                            <label for="username" class="control-label">${msg("usernameOrEmail")}</label>
                            <input tabindex="1" id="username" class="form-control" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" placeholder="name@example.com" />
                            <#if messagesPerField.existsError('username')>
                                <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                            </#if>
                        </div>
                    <#else>
                        <div class="form-group">
                            <label class="control-label">${msg("username")}</label>
                            <span class="readonly">${auth.selectedCredential}</span>
                        </div>
                    </#if>

                    <div class="form-group">
                        <label for="password" class="control-label">${msg("password")}</label>
                        <input tabindex="2" id="password" class="form-control" name="password" type="password" autocomplete="current-password" />
                        <#if messagesPerField.existsError('password')>
                            <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                        </#if>
                    </div>

                    <#if realm.rememberMe && !usernameEditDisabled??>
                        <div class="checkbox">
                            <label>
                                <#if login.rememberMe??>
                                    <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox" checked> ${msg("rememberMe")}
                                <#else>
                                    <input tabindex="3" id="rememberMe" name="rememberMe" type="checkbox"> ${msg("rememberMe")}
                                </#if>
                            </label>
                        </div>
                    </#if>

                    <div class="form-group" style="margin-top: 1.5rem;">
                        <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                        <input tabindex="4" class="btn btn-primary btn-block btn-lg" name="login" id="kc-login" type="submit" value="Sign In"/>
                    </div>
                </form>
            </#if>
        </div>

        <#if realm.password && social.providers??>
            <div class="kc-separator">
                <div class="line"></div>
                <span class="text">or</span>
            </div>
            <div id="kc-social-providers">
                <ul>
                    <#list social.providers as p>
                        <li><a id="social-${p.alias}" class="social-link-${p.providerId}" href="${p.loginUrl}">
                            <#if p.iconClasses?has_content><span class="${p.iconClasses!}" aria-hidden="true"></span></#if>
                            <span>${p.displayName!}</span>
                        </a></li>
                    </#list>
                </ul>
            </div>
        </#if>

        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <#if !(realm.password && social.providers??)>
                <div class="kc-separator">
                    <div class="line"></div>
                    <span class="text">or</span>
                </div>
            </#if>
            <div id="kc-registration-container">
                <span class="kc-registration-text">Don't have an account?
                    <a tabindex="6" href="${url.registrationUrl}" class="kc-registration-link">Create account</a>
                </span>
            </div>
        </#if>
    </div>
</@layout.kc_html>
