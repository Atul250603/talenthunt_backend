function recommendProjects(projects, user) {
    const userSkills = new Set(user.skills.map(skill => skill.toLowerCase().trim()));
    const recommendations = projects.map(project => {
        const projectSkills = new Set(project.skills.map(skill => skill.toLowerCase().trim()));
        const matchingSkills = [...userSkills].filter(skill => projectSkills.has(skill));
        const similarity = matchingSkills.length / projectSkills.size;
        return { ...project._doc, similarity: similarity };
    });

    recommendations.sort((a, b) => a.similarity - b.similarity);
    return recommendations;
}

module.exports= recommendProjects;
