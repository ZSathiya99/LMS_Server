export default function buildInviteEmail({ classroomName, role, inviteLink }) {
  return `
  <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; padding: 50px 20px; line-height: 1.5;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e0e0e0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      
      <div style="background-color: #1a73e8; height: 8px;"></div>

      <div style="padding: 40px 30px;">
        <h1 style="font-size: 24px; color: #202124; margin: 0 0 16px 0; font-weight: 600; text-align: center;">
          Classroom Invitation
        </h1>

        <p style="font-size: 16px; color: #5f6368; text-align: center; margin-bottom: 30px;">
          You've been invited to join a workspace. Click the button below to view the details and respond to the request.
        </p>

        <div style="background-color: #f1f3f4; border-radius: 8px; padding: 20px; margin-bottom: 32px; text-align: center;">
          <div style="font-size: 13px; color: #70757a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px;">Classroom</div>
          <div style="font-size: 20px; color: #1a73e8; font-weight: bold; margin-bottom: 12px;">${classroomName}</div>
        </div>

        <div style="text-align: center;">
          <a href="${inviteLink}"
             style="background-color: #1a73e8; color: #ffffff; padding: 14px 32px; text-decoration: none; font-size: 16px; font-weight: 500; border-radius: 6px; display: inline-block; transition: background-color 0.2s;">
             Join Classroom
          </a>
        </div>

        <p style="font-size: 13px; color: #9aa0a6; text-align: center; margin-top: 40px; border-top: 1px solid #f1f3f4; padding-top: 20px;">
          This invitation was sent to you and will expire in <strong>24 hours</strong>.
        </p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #70757a;">
        If you weren't expecting this email, you can safely ignore it.
      </div>
    </div>
  </div>
  `;
}
