import ProfilePage from '../../../components/common/ProfilePage';
import {
  iamGetProfile,
  iamChangePassword,
  iamUpdatePhoto,
} from '../../../services/profileService';

export default function IamProfilePage() {
  return (
    <ProfilePage
      role="iam"
      getProfile={iamGetProfile}
      updateName={null}           // IAM users cannot change their name
      changePassword={iamChangePassword}
      updatePhoto={iamUpdatePhoto}
    />
  );
}