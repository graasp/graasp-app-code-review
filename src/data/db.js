const buildDatabase = (appContext) => ({
  appData: [],
  members: [
    {
      id: appContext.memberId,
      name: 'mock-member',
    },
  ],
});

export default buildDatabase;
