<#import "template.ftl" as layout>
<@layout.kc_html>
    <!-- Page Header -->
    <div class="kc-page-header">
        <h1>Update password</h1>
        <p>Please create a new password for your account</p>
    </div>

    <!-- Messages -->
    <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
        <div class="alert alert-${message.type}">
            <span>${kcSanitize(message.summary)?no_esc}</span>
        </div>
    </#if>

    <div id="kc-form">
        <div id="kc-form-wrapper">
            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
                <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;"/>
                <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

                <div class="form-group">
                    <label for="password-new" class="control-label">${msg("passwordNew")}</label>
                    <input type="password" id="password-new" name="password-new" class="form-control" autofocus autocomplete="new-password" />
                </div>

                <div class="form-group">
                    <label for="password-confirm" class="control-label">${msg("passwordConfirm")}</label>
                    <input type="password" id="password-confirm" name="password-confirm" class="form-control" autocomplete="new-password" />
                </div>

                <div class="form-group" style="margin-top: 1.5rem;">
                    <#if isAppInitiatedAction??>
                        <input class="btn btn-primary btn-block btn-lg" type="submit" value="${msg("doSubmit")}" />
                        <button class="btn btn-default btn-block btn-lg" type="submit" name="cancel-aia" value="true" style="margin-top: 0.5rem;">${msg("doCancel")}</button>
                    <#else>
                        <input class="btn btn-primary btn-block btn-lg" type="submit" value="${msg("doSubmit")}" />
                    </#if>
                </div>
            </form>
        </div>
    </div>
</@layout.kc_html>
