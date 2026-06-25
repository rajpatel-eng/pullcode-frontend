import ProfilePage from '../../../components/common/ProfilePage';
import {
  adminGetProfile,
  adminUpdateName,
  adminChangePassword,
  adminUpdatePhoto,
} from '../../../services/profileService';

export default function AdminProfilePage() {
  return (
    <ProfilePage
      role="admin"
      getProfile={adminGetProfile}
      updateName={adminUpdateName}
      changePassword={adminChangePassword}
      updatePhoto={adminUpdatePhoto}
    />
  );
}