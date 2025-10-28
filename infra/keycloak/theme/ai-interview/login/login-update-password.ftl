<#import "template.ftl" as layout>
<@layout.kc_html>
    <div id="kc-form">
        <div id="kc-form-wrapper">
            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
                <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;"/>
                <input type="password" id="password" name="password" autocomplete="current-password" style="display:none;"/>

                <div class="form-group">
                    <label for="password-new" class="control-label required">${msg("passwordNew")}</label>
                    <input type="password" id="password-new" name="password-new" class="form-control" autofocus autocomplete="new-password" required />
                </div>

                <div class="form-group">
                    <label for="password-confirm" class="control-label required">${msg("passwordConfirm")}</label>
                    <input type="password" id="password-confirm" name="password-confirm" class="form-control" autocomplete="new-password" required />
                </div>

                <div id="kc-form-buttons" class="form-group">
                    <#if isAppInitiatedAction??>
                        <input class="btn btn-primary btn-block btn-lg" type="submit" value="${msg("doSubmit")}" />
                        <button class="btn btn-default btn-block btn-lg" type="submit" name="cancel-aia" value="true">${msg("doCancel")}</button>
                    <#else>
                        <input class="btn btn-primary btn-block btn-lg" type="submit" value="${msg("doSubmit")}" />
                    </#if>
                </div>
            </form>
        </div>
    </div>
</@layout.kc_html>
