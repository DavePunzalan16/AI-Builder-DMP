import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import Loading from "../components/Loading";
import FullPagePreivew from "../components/FullPagePreivew";
import { useAppContext } from "../context/AppContext";

const PreviewPage = () => {
    const { id } = useParams();

    const {
        activeProject: project,
        loadingActiveProject: loading,
        loadProject,
        user,
        loadingUser,
    } = useAppContext();

    useEffect(() => {
        if (!id || loadingUser || !user) return;

        loadProject(id);
    }, [id, loadingUser, user]);

    if (loadingUser || loading || !project) {
        return <Loading />;
    }

    return <FullPagePreivew files={project.files} />;
};

export default PreviewPage;