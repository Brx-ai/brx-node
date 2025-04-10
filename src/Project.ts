export interface ProjectRequest {
    options?: {
        /**
         * The run mode for the project.
         * Default value: "execute"
         */
        projectRunMode?: string;
        /**
         * Optional flag to specify if history should be used.
         */
        useHistory?: string;
    };
    /**
     * The unique ID of the project.
     */
    projectId: string;
    /**
     * The associated application ID.
     */
    appId: string;
    /**
     * A key-value map for the project's input data.
     */
    inputs: { [key: string]: any };
}