<#import "template.ftl" as layout>
<@layout.kc_html>
    <div id="kc-form">
        <div id="kc-form-wrapper">
            <#if realm.password>
                <form id="kc-form-login" onsubmit="login.disabled = true; return true;" action="${url.loginAction}" method="post">
                    <#if !usernameEditDisabled??>
                        <div class="form-group">
                            <label for="username" class="control-label required">${msg("usernameOrEmail")}</label>
                            <input tabindex="1" id="username" class="form-control" name="username" value="${(login.username!'')}" type="text" autofocus autocomplete="username" required />
                            <#if messagesPerField.existsError('username')>
                                <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                            </#if>
                        </div>
                    <#else>
                        <div class="form-group">
                            <label id="username" class="control-label">${msg("username")}</label>
                            <span class="readonly">${auth.selectedCredential}</span>
                        </div>
                    </#if>

                    <div class="form-group">
                        <label for="password" class="control-label required">${msg("password")}</label>
                        <input tabindex="2" id="password" class="form-control" name="password" type="password" autocomplete="current-password" required />
                        <#if messagesPerField.existsError('password')>
                            <span class="help-block help-block-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                        </#if>
                    </div>

                    <div class="form-group login-pf-settings">
                        <div id="kc-form-options">
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
                        </div>
                        
                        <div class="form-group">
                            <div id="kc-form-buttons">
                                <input type="hidden" id="id-hidden-input" name="credentialId" <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                                <input tabindex="4" class="btn btn-primary btn-block btn-lg" name="login" id="kc-login" type="submit" value="${msg("doLogIn")}"/>
                            </div>
                        </div>
                    </div>
                </form>
            </#if>
        </div>

        <#if realm.password && realm.registrationAllowed && !registrationDisabled??>
            <div id="kc-registration">
                <span>${msg("noAccount")} <a tabindex="6" href="${url.registrationUrl}">${msg("doRegister")}</a></span>
            </div>
        </#if>

        <#if realm.password && social.providers??>
            <div id="kc-social-providers" class="social-providers">
                <ul>
                    <#list social.providers as p>
                        <li><a id="social-${p.alias}" class="btn btn-secondary social-link-${p.providerId}" type="button" href="${p.loginUrl}">
                            <#if p.iconClasses?has_content><span class="${properties.kcCommonLogoIdP} ${p.iconClasses!}" aria-hidden="true"></span></#if>
                            <span class="kc-social-provider-name">${p.displayName!}</span>
                        </a></li>
                    </#list>
                </ul>
            </div>
        </#if>
    </div>

    <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div class="alert alert-${message.type}">
            <#if message.type = 'success'>
                <span class="kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
            <#else>
                <span class="kc-feedback-text">${kcSanitize(message.summary)?no_esc}</span>
            </#if>
        </div>
    </#if>
</@layout.kc_html>
